import { colors, dirname, join } from "$fresh/src/server/deps.ts";
import { ServerContext } from "$fresh/server.ts";
import {
  assertEquals,
  delay,
  DOMParser,
  HTMLElement,
  HTMLMetaElement,
  Page,
  puppeteer,
  TextLineStream,
} from "./deps.ts";
import { deferred } from "$std/async/deferred.ts";

export function parseHtml(input: string): Document {
  // deno-lint-ignore no-explicit-any
  return new DOMParser().parseFromString(input, "text/html") as any;
}

export async function startFreshServer(options: Deno.CommandOptions) {
  const { serverProcess, lines, address, output } = await spawnServer(options);

  if (!address) {
    throw new Error("Server didn't start up");
  }

  return { serverProcess, lines, address, output };
}

export async function fetchHtml(url: string) {
  const res = await fetch(url);
  const html = await res.text();
  // deno-lint-ignore no-explicit-any
  return new DOMParser().parseFromString(html, "text/html") as any as Document;
}

export function assertSelector(doc: Document, selector: string) {
  if (doc.querySelector(selector) === null) {
    const html = prettyDom(doc);
    throw new Error(
      `Selector "${selector}" not found in document.\n\n${html}`,
    );
  }
}

export function assertNotSelector(doc: Document, selector: string) {
  if (doc.querySelector(selector) !== null) {
    const html = prettyDom(doc);
    throw new Error(
      `Selector "${selector}" found in document.\n\n${html}`,
    );
  }
}

export function assertTextMany(
  doc: Document,
  selector: string,
  expected: string[],
) {
  const texts = Array.from(doc.querySelectorAll(selector)).map((el) =>
    el.textContent
  );

  try {
    assertEquals(texts, expected);
  } catch (err) {
    const html = "\n\n" + prettyDom(doc);
    throw new err.constructor(err.message += html, { cause: err });
  }
}

export function assertTextMatch(
  doc: Document,
  selector: string,
  regex: RegExp,
) {
  const texts = Array.from(doc.querySelectorAll(selector)).map((el) =>
    el.textContent
  ).filter(Boolean) as string[];

  if (!texts.some((text) => regex.test(text))) {
    const html = "\n\n" + prettyDom(doc);
    throw new Error(
      `Regex ${regex} did not match any text elements in HTML.\n\n${html}`,
    );
  }
}

export const VOID_ELEMENTS =
  /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;
function prettyDom(doc: Document) {
  let out = colors.dim(`<!DOCTYPE ${doc.doctype?.name ?? ""}>\n`);

  const node = doc.documentElement;
  out += _printDomNode(node, 0);

  return out;
}

function _printDomNode(
  node: HTMLElement | Text | Node,
  indent: number,
) {
  const space = "  ".repeat(indent);

  if (node.nodeType === 3) {
    return space + colors.dim(node.textContent ?? "") + "\n";
  }

  let out = space;
  if (node instanceof HTMLElement || node instanceof HTMLMetaElement) {
    out += colors.dim(colors.cyan("<"));
    out += colors.cyan(node.localName);

    for (let i = 0; i < node.attributes.length; i++) {
      const attr = node.attributes.item(i);
      if (attr === null) continue;
      out += " " + colors.yellow(attr.name);
      out += colors.dim("=");
      out += colors.green(`"${attr.value}"`);
    }

    if (VOID_ELEMENTS.test(node.localName)) {
      out += colors.dim(colors.cyan(">")) + "\n";
      return out;
    }

    out += colors.dim(colors.cyan(">"));
    if (node.childNodes.length) {
      out += "\n";

      for (let i = 0; i < node.childNodes.length; i++) {
        const child = node.childNodes[i];
        out += _printDomNode(child, indent + 1);
      }

      out += space;
    }

    out += colors.dim(colors.cyan("</"));
    out += colors.cyan(node.localName);
    out += colors.dim(colors.cyan(">"));
    out += "\n";
  }

  return out;
}

export async function withChildProcessFresh(
  name: string | { name: string; options: Omit<Deno.CommandOptions, "args"> },
  fn: (address: string) => Promise<void>,
) {
  let file: string;
  let options = {};

  if (typeof name === "object") {
    file = name.name;
    options = name.options ?? {};
  } else {
    file = name;
  }

  const { lines, serverProcess, address } = await startFreshServer({
    ...options,
    args: ["run", "-A", file],
  });

  try {
    await fn(address);
  } finally {
    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;

    // Drain the lines stream
    for await (const _ of lines) { /* noop */ }
  }
}

export async function withFresh(
  name: string,
  fn: (address: string) => Promise<void>,
) {
  const manifestPath = join(Deno.cwd(), dirname(name), "fresh.gen.ts");
  const manifest = (await import(`file://${manifestPath}`)).default;
  const ctx = await ServerContext.fromManifest(manifest, {});
  const abort = new AbortController();

  const def = deferred<string>();

  Deno.serve({
    port: 0,
    signal: abort.signal,
    onListen: (info) => {
      def.resolve(`http://${info.hostname}:${info.port}`);
    },
  }, ctx.handler());

  const address = await def;
  try {
    await fn(address);
  } finally {
    abort.abort();
  }
}

export async function withPageName(
  name: string,
  fn: (page: Page, address: string) => Promise<void>,
) {
  const { lines, serverProcess, address } = await startFreshServer({
    args: ["run", "-A", name],
  });

  try {
    await delay(100);
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

    try {
      const page = await browser.newPage();
      await fn(page, address);
    } finally {
      await browser.close();
    }
  } finally {
    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;

    // Drain the lines stream
    for await (const _ of lines) { /* noop */ }
  }
}

export async function startFreshServerExpectErrors(
  options: Deno.CommandOptions,
) {
  const { serverProcess, lines, address } = await spawnServer(options, true);

  if (address) {
    throw Error("Server started correctly");
  }

  const errorDecoder = new TextDecoderStream();
  const errorLines: ReadableStream<string> = serverProcess.stderr
    .pipeThrough(errorDecoder)
    .pipeThrough(new TextLineStream(), {
      preventCancel: true,
    });
  let output = "";
  for await (const line of errorLines) {
    output += line + "\n";
  }

  try {
    serverProcess.kill("SIGTERM");
  } catch {
    // ignore the error, this may throw on windows if the process has already
    // exited
  }
  await serverProcess.status;
  for await (const _ of lines) { /* noop */ }

  return output;
}

/**
 * Click on an element once it has an attached click listener
 */
export async function clickWhenListenerReady(page: Page, selector: string) {
  await page.waitForSelector(selector);
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel)!;

      // Wait for Preact to have attached either a captured or non-captured
      // click event
      // deno-lint-ignore no-explicit-any
      const preactListener = (el as any).l as Record<string, unknown> | null;
      if (
        !preactListener || typeof preactListener !== "object" ||
        (!preactListener.clickfalse && !preactListener.clicktrue)
      ) {
        return false;
      }

      return true;
    },
    {},
    selector,
  );
  await page.click(selector);
}

export async function waitForText(
  page: Page,
  selector: string,
  text: string,
) {
  await page.waitForSelector(selector);
  await page.waitForFunction(
    (sel, value) => {
      return document.querySelector(sel)!.textContent === value;
    },
    { timeout: 2000 },
    selector,
    String(text),
  );
}

export async function waitForStyle(
  page: Page,
  selector: string,
  name: keyof CSSStyleDeclaration,
  value: string,
) {
  await page.waitForSelector(selector);

  const start = Date.now();
  let now = start;
  let found = false;
  while (now < start + 2000) {
    found = await page.evaluate(
      (s, n, v) => {
        const el = document.querySelector(s);
        if (!el) return false;
        return window.getComputedStyle(el)[n] === v;
      },
      selector,
      name,
      value,
    );

    if (found) break;

    await delay(200);
    now = Date.now();
  }

  if (!found) {
    console.log(prettyDom(parseHtml(await page.content())));
    throw new Error(`Could not find style ${String(name)}: ${value}`);
  }
}

async function spawnServer(
  options: Deno.CommandOptions,
  expectErrors = false,
) {
  const serverProcess = new Deno.Command(Deno.execPath(), {
    ...options,
    stdin: "null",
    stdout: "piped",
    stderr: expectErrors ? "piped" : "inherit",
  }).spawn();

  const lines: ReadableStream<string> = serverProcess.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  const output: string[] = [];
  let address = "";
  // @ts-ignore yes it does
  for await (const line of lines.values({ preventCancel: true })) {
    output.push(line);
    const match = line.match(/https?:\/\/localhost:\d+/g);
    if (match) {
      address = match[0];
      break;
    }
  }

  return { serverProcess, lines, address, output };
}
