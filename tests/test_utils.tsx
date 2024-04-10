import type { App } from "../src/app.ts";
import puppeteer, {
  type Page,
} from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import * as colors from "@std/fmt/colors";
import { type Document, DOMParser, HTMLElement } from "linkedom";
import { FreshDevApp } from "../src/dev/dev_app.ts";
import { TextLineStream } from "@std/streams/text-line-stream";
import * as path from "@std/path";
import type { ComponentChildren } from "preact";
import { FreshScripts } from "../src/runtime/server/preact_hooks.tsx";

export function getIsland(pathname: string) {
  return path.join(
    import.meta.dirname!,
    "fixtures_islands",
    pathname,
  );
}

export function Doc(props: { children?: ComponentChildren }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Test</title>
      </head>
      <body>
        {props.children}
        <FreshScripts />
      </body>
    </html>
  );
}

export async function buildProd(app: App<unknown>) {
  const outDir = await Deno.makeTempDir();
  // FIXME: Sharing build output path is weird
  app.config.build.outDir = outDir;
  const devApp = new FreshDevApp({ build: { outDir } })
    .mountApp("/", app);
  await devApp.build();
}

export async function withBrowserApp(
  app: App<unknown>,
  fn: (page: Page, address: string) => void | Promise<void>,
) {
  await buildProd(app);

  const aborter = new AbortController();
  let server: Deno.HttpServer | null = null;
  let port = 0;
  try {
    server = await Deno.serve({
      hostname: "localhost",
      port: 0,
      signal: aborter.signal,
      onListen: ({ port: p }) => {
        port = p;
      },
    }, await app.handler());

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      // headless: false,
    });

    const page = await browser.newPage();
    // page.setDefaultTimeout(1000000);
    try {
      await fn(page, `http://localhost:${port}`);
    } finally {
      await page.close();
      await browser.close();
    }
  } finally {
    aborter.abort();
    await server?.finished;
  }
}

export async function withBrowser(fn: (page: Page) => void | Promise<void>) {
  const aborter = new AbortController();
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"],
      // headless: false,
    });

    const page = await browser.newPage();
    // page.setDefaultTimeout(1000000);
    try {
      await fn(page);
    } finally {
      await page.close();
      await browser.close();
    }
  } finally {
    aborter.abort();
  }
}

export async function withChildProcessServer(
  dir: string,
  entry: string,
  fn: (address: string) => void | Promise<void>,
) {
  const aborter = new AbortController();
  const cp = await new Deno.Command(Deno.execPath(), {
    args: ["run", "-A", entry],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    cwd: dir,
    signal: aborter.signal,
  }).spawn();

  const lines: ReadableStream<string> = cp.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  const output: string[] = [];
  let address = "";
  // @ts-ignore yes it does
  for await (const line of lines.values({ preventCancel: true })) {
    output.push(line);
    const match = line.match(
      /https?:\/\/localhost:\d+(\/\w+[-\w]*)*/g,
    );
    if (match) {
      address = match[0];
      break;
    }
  }

  try {
    await fn(address);
  } finally {
    aborter.abort();
    await cp.stderr.cancel();
    await cp.status;
    for await (const _ of lines) { /* noop */ }
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
  } else if (node.nodeType === 8) {
    return space + colors.dim(`<--${(node as Text).data}-->`) + "\n";
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

export interface TestDocument extends Document {
  debug(): void;
}

export function parseHtml(input: string): TestDocument {
  // deno-lint-ignore no-explicit-any
  const doc = new DOMParser().parseFromString(input, "text/html") as any;
  Object.defineProperty(doc, "debug", {
    value: () => console.log(prettyDom(doc)),
    enumerable: false,
  });
  return doc;
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

export async function waitForText(
  page: Page,
  selector: string,
  text: string,
) {
  await page.waitForSelector(selector);
  try {
    await page.waitForFunction(
      (sel, value) => {
        return document.querySelector(sel)!.textContent === value;
      },
      { timeout: 2000 },
      selector,
      String(text),
    );
  } catch (err) {
    const body = await page.content();
    // deno-lint-ignore no-explicit-any
    const pretty = prettyDom(parseHtml(body) as any);

    console.log(
      `Text "${text}" not found on selector "${selector}" in html:\n\n${pretty}`,
    );
    throw err;
  }
}
