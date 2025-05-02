import { App, getIslandRegistry, setBuildCache } from "../src/app.ts";
import { launch, type Page } from "@astral/astral";
import * as colors from "@std/fmt/colors";
import { type Document, DOMParser, HTMLElement } from "linkedom";
import { Builder } from "../src/dev/builder.ts";
import { TextLineStream } from "@std/streams/text-line-stream";
import * as path from "@std/path";
import type { ComponentChildren } from "preact";
import { expect } from "@std/expect";
import { ProdBuildCache } from "../src/build_cache.ts";
import { Counter } from "./fixtures_islands/Counter.tsx";
import { CounterWithSlots } from "./fixtures_islands/CounterWithSlots.tsx";
import { EscapeIsland } from "./fixtures_islands/EscapeIsland.tsx";
import { FnIsland } from "./fixtures_islands/FnIsland.tsx";
import { FragmentIsland } from "./fixtures_islands/FragmentIsland.tsx";
import { IslandInIsland } from "./fixtures_islands/IslandInIsland.tsx";
import { JsonIsland } from "./fixtures_islands/JsonIsland.tsx";
import { JsxChildrenIsland } from "./fixtures_islands/JsxChildrenIsland.tsx";
import { JsxConditional } from "./fixtures_islands/JsxConditional.tsx";
import { JsxIsland } from "./fixtures_islands/JsxIsland.tsx";
import { NullIsland } from "./fixtures_islands/NullIsland.tsx";
import { PartialInIsland } from "./fixtures_islands/PartialInIsland.tsx";
import { PassThrough } from "./fixtures_islands/PassThrough.tsx";
import { SelfCounter } from "./fixtures_islands/SelfCounter.tsx";
import { Multiple1, Multiple2 } from "./fixtures_islands/Multiple.tsx";
import { Foo } from "./fixture_island_groups/routes/foo/(_islands)/Foo.tsx";
import { NodeProcess } from "./fixtures_islands/NodeProcess.tsx";
import { FreshAttrs } from "./fixtures_islands/FreshAttrs.tsx";
import { OptOutPartialLink } from "./fixtures_islands/OptOutPartialLink.tsx";

export function getIsland(pathname: string) {
  return path.join(
    import.meta.dirname!,
    "fixtures_islands",
    pathname,
  );
}

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

export async function buildProd(app: App<unknown>) {
  const outDir = await Deno.makeTempDir();
  // FIXME: Sharing build output path is weird
  app.config.buildOutDir = outDir;
  const builder = new Builder({});
  await builder.build(app);
  const cache = await ProdBuildCache.fromSnapshot(
    app.config,
    getIslandRegistry(app).size,
  );
  setBuildCache(app, cache);
}

export async function withBrowserApp(
  app: App<unknown>,
  fn: (page: Page, address: string) => void | Promise<void>,
) {
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

    const browser = await launch({
      args: [
        "--window-size=1280,720",
        ...((Deno.env.get("CI") && Deno.build.os === "linux")
          ? ["--no-sandbox"]
          : []),
      ],
      headless: !Deno.args.includes("--headful"),
    });

    const page = await browser.newPage();
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
    const browser = await launch({
      args: [
        "--window-size=1280,7201",
        ...((Deno.env.get("CI") && Deno.build.os === "linux")
          ? ["--no-sandbox"]
          : []),
      ],
      headless: !Deno.args.includes("--headful"),
    });

    const page = await browser.newPage();
    // page.setDefaultTimeout(1000000);
    try {
      await fn(page);
    } catch (err) {
      try {
        const raw = await page.content();
        const doc = parseHtml(raw);
        const html = prettyDom(doc);
        // deno-lint-ignore no-console
        console.log(html);
      } catch {
        // Ignore
      }
      throw err;
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
    stderr: "inherit",
    cwd: dir,
    signal: aborter.signal,
  }).spawn();

  const lines: ReadableStream<string> = cp.stdout
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new TextLineStream());

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

export const allIslandApp = new App()
  .island(getIsland("Counter.tsx"), "Counter", Counter)
  .island(
    getIsland("CounterWithSlots.tsx"),
    "CounterWithSlots",
    CounterWithSlots,
  )
  .island(getIsland("EscapeIsland.tsx"), "EscapeIsland", EscapeIsland)
  .island(getIsland("FnIsland.tsx"), "FnIsland", FnIsland)
  .island(getIsland("FragmentIsland.tsx"), "FragmentIsland", FragmentIsland)
  .island(getIsland("IslandInIsland.tsx"), "IslandInIsland", IslandInIsland)
  .island(getIsland("JsonIsland.tsx"), "JsonIsland", JsonIsland)
  .island(
    getIsland("JsxChildrenIsland.tsx"),
    "JsxChildrenIsland",
    JsxChildrenIsland,
  )
  .island(getIsland("JsxConditional.tsx"), "JsxConditional", JsxConditional)
  .island(getIsland("JsxIsland.tsx"), "JsxIsland", JsxIsland)
  .island(getIsland("Multiple.tsx"), "Multiple1", Multiple1)
  .island(getIsland("Multiple.tsx"), "Multiple2", Multiple2)
  .island(getIsland("NullIsland.tsx"), "NullIsland", NullIsland)
  .island(getIsland("PartialInIsland.tsx"), "PartialInIsland", PartialInIsland)
  .island(getIsland("PassThrough.tsx"), "PassThrough", PassThrough)
  .island(getIsland("SelfCounter.tsx"), "SelfCounter", SelfCounter)
  .island(getIsland("NodeProcess.tsx"), "NodeProcess", NodeProcess)
  .island(getIsland("FreshAttrs.tsx"), "FreshAttrs", FreshAttrs)
  .island(
    getIsland("OptOutPartialLink.tsx"),
    "OptOutPartialLink",
    OptOutPartialLink,
  )
  .island(
    getIsland("../fixture_island_groups/routes/foo/(_islands)/Foo.tsx"),
    "Foo",
    Foo,
  );
