import { colors } from "$fresh/src/server/deps.ts";
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

export function parseHtml(input: string) {
  return new DOMParser().parseFromString(input, "text/html");
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
  console.log(out);

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
    await lines.cancel();

    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;
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
    await lines.cancel();

    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;
  }
}

export async function startFreshServerExpectErrors(
  options: Deno.CommandOptions,
) {
  const { serverProcess, address } = await spawnServer(options, true);

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

  const decoder = new TextDecoderStream();
  const lines: ReadableStream<string> = serverProcess.stdout
    .pipeThrough(decoder)
    .pipeThrough(new TextLineStream(), {
      preventCancel: true,
    });

  const output: string[] = [];
  let address = "";
  for await (const line of lines) {
    output.push(line);
    const match = line.match(/https?:\/\/localhost:\d+/g);
    if (match) {
      address = match[0];
      break;
    }
  }

  return { serverProcess, lines, address, output };
}
