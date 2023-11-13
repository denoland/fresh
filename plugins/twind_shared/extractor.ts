import {
  escape as escapeHtml,
  unescape as unescapeHtml,
} from "https://deno.land/std@0.205.0/html/entities.ts";

const HTML_CLASS_REG = /(<[a-z][a-z-]*\s[^>]*class=")(.*?)("[>\s/])/g;

const enum Char {
  SPACE = 32,
  "(" = 40,
  ")" = 41,
  ":" = 58,
}

/**
 * Most tailwind-like libraries support a grouping syntax where
 * a common prefix is applied to every member in-between braces.
 *
 * Case: text(3xl green-600) -> text-3xl text-green-600
 * Case: hover:(foo bar) -> hover:foo hover:bar
 */
export function expandTailwindGroups(value: string): string {
  let normalized = "";
  let openGroup = 0;
  let start = 0;
  let groupPrefixStart = 0;
  let groupPrefixEnd = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);

    if (ch === Char["("]) {
      openGroup++;
      groupPrefixStart = start;
      groupPrefixEnd = i;
      start = i + 1;
    } else if (ch === Char[")"]) {
      if (normalized !== "") normalized += " ";

      let str = value.slice(groupPrefixStart, groupPrefixEnd);
      if (value.charCodeAt(groupPrefixEnd - 1) !== Char[":"]) {
        str += "-";
      }
      const valuePart = value.slice(start, i);
      const variantIdx = valuePart.lastIndexOf(":");

      if (variantIdx > -1) {
        str = valuePart.slice(0, variantIdx + 1) + str +
          valuePart.slice(variantIdx + 1);
      } else {
        str += valuePart;
      }

      normalized += str;

      openGroup--;
      start = i + 1;
    } else if (ch === Char.SPACE) {
      if ((openGroup > 0 || start < i) && normalized !== "") {
        normalized += " ";
      }

      let str = "";
      if (openGroup > 0) {
        str += value.slice(groupPrefixStart, groupPrefixEnd);

        if (value.charCodeAt(groupPrefixEnd - 1) !== Char[":"]) {
          str += "-";
        }
      }

      if (start < i) {
        const valuePart = value.slice(start, i);
        const variantIdx = valuePart.lastIndexOf(":");

        if (variantIdx > -1) {
          str = valuePart.slice(0, variantIdx + 1) + str +
            valuePart.slice(variantIdx + 1);
        } else {
          str += valuePart;
        }

        normalized += str;
      }
      start = i + 1;
    }
  }

  if (start < value.length) {
    if (normalized !== "") normalized += " ";
    normalized += value.slice(start);
  }

  return normalized;
}

export interface ExtractResult {
  classNames: string;
  html: string;
}

export interface ExtractClassNamesOptions {
  decodeHtml?: boolean;
}

export function extractAndExpandClassNames(
  html: string,
  options: ExtractClassNamesOptions = {},
): ExtractResult {
  let classNames = "";
  let outHtml = "";

  let matchEnd = 0;

  for (const match of html.matchAll(HTML_CLASS_REG)) {
    let value = match[2] ?? "";
    const original = value;
    if (options.decodeHtml) {
      value = unescapeHtml(value);
    }

    const matchIndex = match.index ?? 0;

    if (matchIndex > 0 && matchEnd < matchIndex) {
      outHtml += html.slice(matchEnd, matchIndex);
    }

    matchEnd = matchIndex + match[0].length;
    outHtml += match[1];

    let expanded = expandTailwindGroups(value);
    if (classNames !== "") classNames += " ";
    classNames += expanded;

    if (options.decodeHtml && value !== original) {
      expanded = escapeHtml(expanded);
    }
    outHtml += expanded;
    outHtml += match[3];
  }

  if (matchEnd < html.length) {
    outHtml += html.slice(matchEnd);
  }

  return { classNames, html: outHtml };
}
