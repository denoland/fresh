import { DOMParser } from "linkedom";
import * as colors from "@std/fmt/colors";
import type { Page } from "@astral/astral";

export const VOID_ELEMENTS =
  /^(?:area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr)$/;

function _printDomNode(node: HTMLElement | Text | Node, indent: number) {
  const space = "  ".repeat(indent);

  if ((node as Node).nodeType === 3) {
    return space + colors.dim((node as Text).textContent ?? "") + "\n";
  } else if ((node as Node).nodeType === 8) {
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
        const child = node.childNodes[i] as unknown as
          | HTMLElement
          | Text
          | Node;
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

function prettyDom(doc: Document) {
  let out = colors.dim(`<!DOCTYPE ${doc.doctype?.name ?? ""}>\n`);
  const node = doc.documentElement as unknown as HTMLElement;
  out += _printDomNode(node, 0);
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
