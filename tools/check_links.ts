import { DOMParser } from "linkedom";
import * as path from "@std/path";
import { launchProd } from "../packages/plugin-vite/tests/test_utils.ts";
import { createBuilder } from "vite";

const www = path.join(import.meta.dirname!, "..", "www");

// deno-lint-ignore no-console
console.log("Building www...");
const builder = await createBuilder({ root: www });
await builder.buildApp();

const EXCLUDED_EXTENSIONS = new Set([
  ".ts",
  ".js",
  ".svg",
  ".json",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".ico",
  ".xml",
  ".css",
  ".woff",
  ".woff2",
]);

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

interface EmptyLink {
  page: string;
  html: string;
}

const visitedPages = new Set<string>();
const failedLinks: FailedLink[] = [];
const emptyLinks: EmptyLink[] = [];

await launchProd({ cwd: www }, async (address) => {
  const rootUrl = new URL(address);
  const queue: Array<{ url: URL; referrer: string }> = [
    { url: rootUrl, referrer: "(start)" },
  ];

  while (queue.length > 0) {
    const current = queue.pop()!;
    const pathname = current.url.pathname;

    if (visitedPages.has(pathname)) continue;
    visitedPages.add(pathname);

    Deno.stdout.writeSync(new TextEncoder().encode("."));

    let res: Response;
    try {
      res = await fetch(current.url, {
        headers: {
          accept:
            "text/html, application/xhtml+xml, application/xml;q=0.9, */*;q=0.8",
        },
      });
    } catch {
      failedLinks.push({
        url: current.url.href,
        status: 0,
        referrer: current.referrer,
      });
      continue;
    }

    if (res.status >= 400) {
      failedLinks.push({
        url: current.url.href,
        status: res.status,
        referrer: current.referrer,
      });
      await res.body?.cancel();
      continue;
    }

    if (!res.headers.get("content-type")?.includes("text/html")) {
      await res.body?.cancel();
      continue;
    }

    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "text/html");

    for (const link of doc.querySelectorAll("a")) {
      const href = link.getAttribute("href")?.trim();

      if (!href) {
        emptyLinks.push({
          page: current.url.pathname,
          html: link.outerHTML.slice(0, 120),
        });
        continue;
      }

      // Skip excluded protocols
      if (EXCLUDED_PREFIXES.some((p) => href.startsWith(p))) continue;

      // Skip fragment-only links
      if (href.startsWith("#")) continue;

      // Skip external links
      let nextUrl: URL;
      try {
        nextUrl = new URL(href, current.url);
      } catch {
        continue;
      }
      if (nextUrl.origin !== rootUrl.origin) continue;

      // Strip fragment
      nextUrl.hash = "";

      // Skip excluded file extensions
      const ext = path.extname(nextUrl.pathname);
      if (ext && EXCLUDED_EXTENSIONS.has(ext)) continue;

      if (visitedPages.has(nextUrl.pathname)) continue;

      queue.push({ url: nextUrl, referrer: current.url.pathname });
    }
  }
});

// deno-lint-ignore no-console
console.log();
// deno-lint-ignore no-console
console.log();
// deno-lint-ignore no-console
console.log(`Pages checked: ${visitedPages.size}`);

if (emptyLinks.length > 0) {
  // deno-lint-ignore no-console
  console.warn(`\nEmpty links found: ${emptyLinks.length}`);
  for (const link of emptyLinks) {
    // deno-lint-ignore no-console
    console.warn(`  ${link.page}: ${link.html}`);
  }
}

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
console.log("All links OK!");
