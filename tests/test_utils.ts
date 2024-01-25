import {
  FromManifestConfig,
  Manifest,
  ServeHandlerInfo,
  ServerContext,
} from "../server.ts";
import {
  assert,
  assertEquals,
  basename,
  colors,
  delay,
  dirname,
  DOMParser,
  HTMLElement,
  HTMLMetaElement,
  join,
  Page,
  puppeteer,
  TextLineStream,
  toFileUrl,
} from "./deps.ts";

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

export async function getErrorOverlay(
  server: FakeServer,
  url: string,
): Promise<{ title: string; codeFrame: boolean; stack: string }> {
  const doc = await server.getHtml(url);
  const iframe = doc.querySelector<HTMLIFrameElement>(
    "#fresh-error-overlay",
  );
  assert(iframe, "Missing fresh error overlay");

  const doc2 = await server.getHtml(iframe.src);

  return {
    title: doc2.querySelector(".title")!.textContent!,
    codeFrame: doc2.querySelector(".code-frame") !== null,
    stack: doc2.querySelector(".stack")!.textContent!,
  };
}

export async function withFresh(
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

export async function withPageName(
  name: string | { name: string; options: Omit<Deno.CommandOptions, "args"> },
  fn: (page: Page, address: string) => Promise<void>,
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

export interface FakeServer {
  request(req: Request): Promise<Response>;
  getHtml(pathname: string): Promise<TestDocument>;
  get(pathname: string): Promise<Response>;
}

async function handleRequest(
  handler: ReturnType<ServerContext["handler"]>,
  conn: ServeHandlerInfo,
  req: Request,
) {
  let res = await handler(req, conn);

  // Follow redirects
  while (res.headers.has("location")) {
    let loc = res.headers.get("location")!;
    const hostname = conn.remoteAddr.hostname;
    if (!loc.startsWith("http://") && !loc.startsWith("https://")) {
      loc = `https://${hostname}${loc}`;
    }

    res = await handler(new Request(loc), conn);
  }

  return res;
}

export async function fakeServe(
  manifest: Manifest,
  config: FromManifestConfig,
): Promise<FakeServer> {
  const ctx = await ServerContext.fromManifest(manifest, config);
  const handler = ctx.handler();

  const conn: ServeHandlerInfo = {
    remoteAddr: {
      transport: "tcp",
      hostname: "127.0.0.1",
      port: 80,
    },
  };

  const origin = `https://127.0.0.1`;

  return {
    request(req) {
      return handler(req, conn);
    },
    async getHtml(pathname) {
      const req = new Request(`${origin}${pathname}`);
      const res = await handleRequest(handler, conn, req);
      return parseHtml(await res.text());
    },
    get(pathname: string) {
      const req = new Request(`${origin}${pathname}`);
      return handleRequest(handler, conn, req);
    },
  };
}

export async function withFakeServe(
  name: string,
  cb: (server: FakeServer) => Promise<void> | void,
  options: { loadConfig?: boolean } = {},
) {
  const fixture = join(Deno.cwd(), name);
  const dev = basename(name) === "dev.ts";
  if (dev) {
    try {
      await Deno.remove(join(fixture, "_fresh"));
    } catch (_err) {
      // ignore
    }
  }

  const manifestPath = toFileUrl(join(dirname(fixture), "fresh.gen.ts")).href;
  const manifestMod = await import(manifestPath);

  const configPath = join(dirname(fixture), "fresh.config.ts");

  let config: FromManifestConfig = { dev };

  // For now we load config on a case by case basis, because something in
  // twind (unsure) doesn't work well if multiple instances are running
  if (options.loadConfig) {
    try {
      const stats = await Deno.stat(configPath);
      if (stats.isFile) {
        const m = await import(toFileUrl(configPath).href);
        config = m.default;
        config.dev = dev;
      }
    } catch {
      // ignore
    }
  }

  const server = await fakeServe(manifestMod.default, config);
  await cb(server);
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
        return globalThis.getComputedStyle(el)[n] === v;
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
    const match = line.match(
      /https?:\/\/localhost:\d+(\/\w+[-\w]*)*/g,
    );
    if (match) {
      address = match[0];
      break;
    }
  }

  return { serverProcess, lines, address, output };
}

export async function recreateFolder(folderPath: string) {
  try {
    await Deno.remove(folderPath);
  } catch {
    // ignore
  }
  try {
    await Deno.mkdir(folderPath, { recursive: true });
  } catch {
    // ignore
  }
}

export async function runBuild(fixture: string) {
  const outDir = join(dirname(fixture), "_fresh");
  try {
    await Deno.remove(outDir, { recursive: true });
  } catch {
    // Ignore
  }

  assert(
    fixture.endsWith("dev.ts"),
    `Build command only works with "dev.ts", but got "${fixture}" instead`,
  );
  const res = await new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "-A",
      fixture,
      "build",
    ],
    env: {
      GITHUB_SHA: "__BUILD_ID__",
      DENO_DEPLOYMENT_ID: "__BUILD_ID__",
    },
    stdin: "null",
    stdout: "piped",
    stderr: "piped",
  }).output();

  const output = getStdOutput(res);
  return {
    code: res.code,
    stderr: output.stderr,
    stdout: output.stdout,
  };
}

export function getStdOutput(
  out: Deno.CommandOutput,
): { stdout: string; stderr: string } {
  const decoder = new TextDecoder();
  const stdout = colors.stripColor(decoder.decode(out.stdout));

  const decoderErr = new TextDecoder();
  const stderr = colors.stripColor(decoderErr.decode(out.stderr));

  return { stdout, stderr };
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
      await delay(100);
      now = Date.now();
    }
  }

  throw new Error(`Timed out`);
}

function walk(doc: Document, node: HTMLElement): string | null {
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];

    if (child.nodeType === doc.COMMENT_NODE) {
      return child.data;
    } else if (child.nodeType === doc.TEXT_NODE) {
      continue;
    } else if (
      child.nodeType === doc.ELEMENT_NODE && node.localName !== "template"
    ) {
      const res = walk(doc, child);
      if (res !== null) return res;
    }
  }
  return null;
}

export async function assertNoPageComments(page: Page) {
  const doc = parseHtml(await page.content());

  // deno-lint-ignore no-explicit-any
  const result = walk(doc, doc.body as any);

  if (result !== null) {
    console.log(prettyDom(doc));
    throw new Error(
      `Expected no HTML comments to be present, but found comment "${result}"`,
    );
  }
}

export function assertNoComments(doc: Document) {
  // deno-lint-ignore no-explicit-any
  const result = walk(doc, doc.body as any);

  if (result !== null) {
    console.log(prettyDom(doc));
    throw new Error(
      `Expected no HTML comments to be present, but found comment "${result}"`,
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
    console.log(prettyDom(doc));
    throw new Error(
      `No <meta>-tag found with content "${expected}"`,
    );
  }
  assertEquals(el.content, expected);
}
