import { DOMParser } from "linkedom";
import * as path from "@std/path";
import { TextLineStream } from "@std/streams/text-line-stream";
import { mergeReadableStreams } from "@std/streams";
import * as colors from "@std/fmt/colors";
import { createBuilder } from "vite";

const www = path.join(import.meta.dirname!, "..", "www");

const totalStart = performance.now();

// deno-lint-ignore no-console
console.log("Building www...");
let stepStart = performance.now();
const builder = await createBuilder({ root: www });
await builder.buildApp();
// deno-lint-ignore no-console
console.log(
  `Build completed in ${((performance.now() - stepStart) / 1000).toFixed(1)}s`,
);

const EXCLUDED_PREFIXES = [
  "mailto:",
  "javascript:",
  "vscode:",
  "data:",
];

interface FailedLink {
  url: string;
  status: number;
  referrer: string;
}

const checkedUrls = new Map<string, number>();
const visitedPages = new Set<string>();
const failedLinks: FailedLink[] = [];
const CONCURRENCY = 10;

// deno-lint-ignore no-console
console.log("Starting server...");

// Spawn the prod server directly to avoid importing test_utils.tsx
// (which launches a headless browser at module scope)
const cp = new Deno.Command(Deno.execPath(), {
  args: ["serve", "-A", "--cached-only", "--port", "0", "_fresh/server.js"],
  stdin: "null",
  stdout: "piped",
  stderr: "piped",
  cwd: www,
}).spawn();

// Read server output to find the address
const linesStdout = cp.stdout
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());
const linesStderr = cp.stderr
  .pipeThrough(new TextDecoderStream())
  .pipeThrough(new TextLineStream());
const lines = mergeReadableStreams(linesStdout, linesStderr);

let address = "";
// @ts-ignore yes it does
for await (const raw of lines.values({ preventCancel: true })) {
  const line = colors.stripAnsiCode(raw);
  const match = line.match(/https?:\/\/[^:]+:\d+(\/\w+[-\w]*)*/g);
  if (match) {
    address = match[0];
    break;
  }
}

if (!address) {
  // deno-lint-ignore no-console
  console.error("Could not find server address");
  cp.kill();
  Deno.exit(1);
}

// deno-lint-ignore no-console
console.log(`Server listening at ${address}`);

const rootUrl = new URL(address);

async function checkUrl(
  url: string,
  referrer: string,
): Promise<number> {
  const cached = checkedUrls.get(url);
  if (cached !== undefined) return cached;

  // Mark as in-flight to avoid duplicate checks
  checkedUrls.set(url, 0);

  try {
    const res = await fetch(url, {
      method: "HEAD",
      headers: { "User-Agent": "fresh-link-checker" },
      redirect: "follow",
    });
    checkedUrls.set(url, res.status);
    if (res.status >= 400) {
      failedLinks.push({ url, status: res.status, referrer });
    }
    return res.status;
  } catch {
    checkedUrls.set(url, 0);
    failedLinks.push({ url, status: 0, referrer });
    return 0;
  }
}

async function crawlPage(pageUrl: URL, referrer: string) {
  const pathname = pageUrl.pathname;
  if (visitedPages.has(pathname)) return;
  visitedPages.add(pathname);

  let res: Response;
  try {
    res = await fetch(pageUrl, {
      headers: {
        accept:
          "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
      },
    });
  } catch {
    failedLinks.push({ url: pageUrl.href, status: 0, referrer });
    return;
  }

  if (res.status >= 400) {
    failedLinks.push({ url: pageUrl.href, status: res.status, referrer });
    await res.body?.cancel();
    return;
  }

  if (!res.headers.get("content-type")?.includes("text/html")) {
    await res.body?.cancel();
    return;
  }

  const text = await res.text();
  Deno.stdout.writeSync(new TextEncoder().encode("."));
  const doc = new DOMParser().parseFromString(text, "text/html");

  const linkChecks: Array<Promise<void>> = [];
  const internalPages: Array<{ url: URL; referrer: string }> = [];

  for (const link of doc.querySelectorAll("a")) {
    const href = link.getAttribute("href")?.trim();
    if (!href) continue;
    if (EXCLUDED_PREFIXES.some((p) => href.startsWith(p))) continue;
    if (href.startsWith("#")) continue;

    let nextUrl: URL;
    try {
      nextUrl = new URL(href, pageUrl);
    } catch {
      continue;
    }

    // Strip fragment
    nextUrl.hash = "";
    const urlStr = nextUrl.href;

    if (nextUrl.origin === rootUrl.origin) {
      // Internal link — crawl the page if it's a docs page
      if (
        !visitedPages.has(nextUrl.pathname) &&
        nextUrl.pathname.startsWith("/docs")
      ) {
        internalPages.push({ url: nextUrl, referrer: pathname });
      } else if (!visitedPages.has(nextUrl.pathname)) {
        // Non-docs internal page: just check it returns OK
        if (!checkedUrls.has(urlStr)) {
          linkChecks.push(checkUrl(urlStr, pathname).then(() => {}));
        }
      }
    } else {
      // External link — verify it's live
      if (!checkedUrls.has(urlStr)) {
        linkChecks.push(checkUrl(urlStr, pathname).then(() => {}));
      }
    }
  }

  // Check external/non-docs links concurrently
  const batched: Array<Promise<void>> = [];
  for (const check of linkChecks) {
    batched.push(check);
    if (batched.length >= CONCURRENCY) {
      await Promise.all(batched);
      batched.length = 0;
    }
  }
  if (batched.length > 0) await Promise.all(batched);

  // Crawl internal docs pages
  for (const page of internalPages) {
    await crawlPage(page.url, page.referrer);
  }
}

// Start crawling from /docs
stepStart = performance.now();
// deno-lint-ignore no-console
console.log("Crawling docs pages...");

const docsUrl = new URL("/docs", rootUrl);
await crawlPage(docsUrl, "(start)");

// deno-lint-ignore no-console
console.log();
// deno-lint-ignore no-console
console.log(
  `\nCrawl completed in ${
    ((performance.now() - stepStart) / 1000).toFixed(1)
  }s`,
);
// deno-lint-ignore no-console
console.log(`Docs pages crawled: ${visitedPages.size}`);
// deno-lint-ignore no-console
console.log(`Total links checked: ${checkedUrls.size}`);
// deno-lint-ignore no-console
console.log(
  `Total time: ${((performance.now() - totalStart) / 1000).toFixed(1)}s`,
);

// Kill the server
cp.kill();
await cp.status;

if (failedLinks.length > 0) {
  // deno-lint-ignore no-console
  console.error(`\nBroken links found: ${failedLinks.length}`);
  for (const link of failedLinks) {
    // deno-lint-ignore no-console
    console.error(
      `  ${link.status} ${link.url} (linked from ${link.referrer})`,
    );
  }
  Deno.exit(1);
}

// deno-lint-ignore no-console
console.log("\nAll links OK!");
Deno.exit(0);
