import { type App, setBuildCache } from "../src/app.ts";
import { launch, type Page } from "@astral/astral";
import * as colors from "@std/fmt/colors";
import { DOMParser, HTMLElement } from "linkedom";
import { Builder, type BuildOptions } from "../src/dev/builder.ts";
import { TextLineStream } from "@std/streams/text-line-stream";
import * as path from "@std/path";
import type { ComponentChildren } from "preact";
import { expect } from "@std/expect";
import { mergeReadableStreams } from "@std/streams";

const browser = await launch({
  args: [
    "--window-size=1280,720",
    ...((Deno.env.get("CI") && Deno.build.os === "linux")
      ? ["--no-sandbox"]
      : []),
  ],
  headless: Deno.env.get("HEADLESS") !== "false",
});

export const charset = <meta charset="utf-8" />;

export const favicon = (
  <link
    href="data:image/x-icon;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQEAYAAABPYyMiAAAABmJLR0T///////8JWPfcAAAACXBIWXMAAABIAAAASABGyWs+AAAAF0lEQVRIx2NgGAWjYBSMglEwCkbBSAcACBAAAeaR9cIAAAAASUVORK5CYII="
    rel="icon"
    type="image/x-icon"
  />
);

export function Doc(props: { children?: ComponentChildren; title?: string }) {
  return (
    <html>
      <head>
        {charset}
        <title>{props.title ?? "Test"}</title>
        {favicon}
      </head>
      <body>
        {props.children}
      </body>
    </html>
  );
}

export const ALL_ISLAND_DIR = path.join(
  import.meta.dirname!,
  "fixtures_islands",
);
export const ISLAND_GROUP_DIR = path.join(
  import.meta.dirname!,
  "fixture_island_groups",
);

export async function buildProd(
  options: Omit<BuildOptions, "outDir">,
): Promise<<T>(app: App<T>) => void> {
  const outDir = await Deno.makeTempDir();
  const builder = new Builder({ outDir, ...options });
  const cache = await builder.buildForTests();

  return (app) => setBuildCache(app, cache);
}

export async function withBrowserApp(
  app: App<unknown>,
  fn: (page: Page, address: string) => void | Promise<void>,
) {
  const aborter = new AbortController();
  await using server = Deno.serve({
    hostname: "localhost",
    port: 0,
    signal: aborter.signal,
    onListen: () => {}, // Don't spam terminal with "Listening on..."
  }, app.handler());

  try {
    await using page = await browser.newPage();
    await fn(page, `http://localhost:${server.addr.port}`);
  } finally {
    aborter.abort();
  }
}

export async function withBrowser(fn: (page: Page) => void | Promise<void>) {
  await using page = await browser.newPage();
  try {
    await fn(page);
  } catch (err) {
    const raw = await page.content();
    const doc = parseHtml(raw);
    const html = prettyDom(doc);
    // deno-lint-ignore no-console
    console.log(html);
    throw err;
  }
}

export async function withChildProcessServer(
  dir: string,
  task: string,
  fn: (address: string) => void | Promise<void>,
) {
  const aborter = new AbortController();
  const cp = await new Deno.Command(Deno.execPath(), {
    args: ["task", task],
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
    cwd: dir,
    signal: aborter.signal,
  }).spawn();

  const linesStdout: ReadableStream<string> = cp.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  const linesStderr: ReadableStream<string> = cp.stderr
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

  const lines = mergeReadableStreams(linesStdout, linesStderr);

  const output: string[] = [];
  let address = "";
  let found = false;
  // @ts-ignore yes it does
  for await (const line of lines.values({ preventCancel: true })) {
    output.push(line);
    const match = line.match(
      /https?:\/\/[^:]+:\d+(\/\w+[-\w]*)*/g,
    );
    if (match) {
      address = match[0];
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error(`Could not find server address`);
  }

  try {
    await fn(address);
  } finally {
    aborter.abort();
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
    // deno-lint-ignore no-console
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

export function assertMetaContent(
  doc: Document,
  nameOrProperty: string,
  expected: string,
) {
  let el = doc.querySelector(`meta[name="${nameOrProperty}"]`) as
    | HTMLMetaElement
    | null;

  if (el === null) {
    el = doc.querySelector(`meta[property="${nameOrProperty}"]`) as
      | HTMLMetaElement
      | null;
  }

  if (el === null) {
    // deno-lint-ignore no-console
    console.log(prettyDom(doc));
    throw new Error(
      `No <meta>-tag found with content "${expected}"`,
    );
  }
  expect(el.content).toEqual(expected);
}

export async function waitForText(
  page: Page,
  selector: string,
  text: string,
) {
  await page.waitForSelector(selector);
  try {
    await page.waitForFunction(
      (sel: string, value: string) => {
        const el = document.querySelector(sel);
        if (el === null) return false;
        return el.textContent === value;
      },
      { args: [selector, String(text)] },
    );
  } catch (err) {
    const body = await page.content();
    // deno-lint-ignore no-explicit-any
    const pretty = prettyDom(parseHtml(body) as any);

    // deno-lint-ignore no-console
    console.log(
      `Text "${text}" not found on selector "${selector}" in html:\n\n${pretty}`,
    );
    throw err;
  }
}

export async function waitFor(
  fn: () => Promise<unknown> | unknown,
): Promise<void> {
  let now = Date.now();
  const limit = now + 2000;

  while (now < limit) {
    try {
      if (await fn()) return;
    } catch (err) {
      if (now > limit) {
        throw err;
      }
    } finally {
      await new Promise((r) => setTimeout(r, 250));
      now = Date.now();
    }
  }

  throw new Error(`Timed out`);
}

export function getStdOutput(
  out: Deno.CommandOutput,
): { stdout: string; stderr: string } {
  const decoder = new TextDecoder();
  const stdout = colors.stripAnsiCode(decoder.decode(out.stdout));

  const decoderErr = new TextDecoder();
  const stderr = colors.stripAnsiCode(decoderErr.decode(out.stderr));

  return { stdout, stderr };
}

const ISLAND_FIXTURE_DIR = path.join(import.meta.dirname!, "fixtures_islands");
const allIslandBuilder = new Builder({});
for await (const entry of Deno.readDirSync(ISLAND_FIXTURE_DIR)) {
  if (entry.name.endsWith(".json")) continue;

  const spec = path.join(ISLAND_FIXTURE_DIR, entry.name);
  allIslandBuilder.registerIsland(spec);
}
