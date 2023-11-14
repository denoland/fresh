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
 * Case: text(sm:foo bar) -> sm:text-foo text-bar
 * Case: focus:(text(green-600 bar)) -> focus:text-green-600 foucs:text-bar
 */
export function expandTailwindGroups(
  value: string,
): string {
  const prefixes: string[] = [];
  let normalized = "";
  let start = 0;
  let closeIdx = 0;
  for (let i = 0; i < value.length; i++) {
    const ch = value.charCodeAt(i);

    if (ch === Char["("]) {
      let raw = value.slice(start, i);
      if (!raw.endsWith(":")) {
        raw += "-";
      }
      prefixes.push(raw);
      start = i + 1;
    } else if (ch === Char[")"]) {
      if (closeIdx === i - 1) {
        prefixes.pop();
        start = i + 1;
        continue;
      }
      closeIdx = i;
      let str = prefixes.join("");
      prefixes.pop();

      const valuePart = value.slice(start, i);
      const variantIdx = valuePart.lastIndexOf(":");

      if (variantIdx > -1) {
        str = valuePart.slice(0, variantIdx + 1) + str +
          valuePart.slice(variantIdx + 1);
      } else {
        str += valuePart;
      }

      if (normalized !== "" && normalized[normalized.length - 1] !== " ") {
        normalized += " ";
      }
      normalized += str;

      start = i + 1;
    } else if (ch === Char.SPACE) {
      let str = prefixes.join("");
      if (start < i) {
        const valuePart = value.slice(start, i);
        const variantIdx = valuePart.lastIndexOf(":");

        if (variantIdx > -1) {
          str = valuePart.slice(0, variantIdx + 1) + str +
            valuePart.slice(variantIdx + 1);
        } else {
          str += valuePart;
        }

        if (normalized !== "" && normalized[normalized.length - 1] !== " ") {
          normalized += " ";
        }
        normalized += str;
      }
      start = i + 1;
    }
  }

  if (start < value.length) {
    if (normalized !== "" && normalized[normalized.length - 1] !== " ") {
      normalized += " ";
    }
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
  expandCache?: Map<string, string>;
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

    const cached = options.expandCache
      ? options.expandCache.get(value)
      : undefined;

    let expanded = cached ?? expandTailwindGroups(value);
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
