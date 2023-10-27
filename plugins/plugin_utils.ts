const HTML_CLASS_REG = /(<[A-Za-z][^>]*\s+class=")(.*?)("[>\s/])/g;

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

      normalized += value.slice(groupPrefixStart, groupPrefixEnd);
      if (value.charCodeAt(groupPrefixEnd - 1) !== Char[":"]) {
        normalized += "-";
      }
      normalized += value.slice(start, i);

      openGroup--;
      start = i + 1;
    } else if (ch === Char.SPACE) {
      if ((openGroup > 0 || start < i) && normalized !== "") {
        normalized += " ";
      }

      if (openGroup > 0) {
        normalized += value.slice(groupPrefixStart, groupPrefixEnd);

        if (value.charCodeAt(groupPrefixEnd - 1) !== Char[":"]) {
          normalized += "-";
        }
      }

      if (start < i) {
        normalized += value.slice(start, i);
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

function decodeHtmlEntities(input: string): string {
  return input
    .replaceAll(/&amp;/g, "&")
    .replaceAll(/&lt;/g, "<")
    .replaceAll(/&gt;/g, ">")
    .replaceAll(/&quot;/g, '"')
    .replaceAll(/&#39;/g, "'");
}

function encodeHtmlEntities(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function extractCssClasses(html: string): ExtractResult {
  let classNames = "";
  let outHtml = "";

  let matchEnd = 0;

  for (const match of html.matchAll(HTML_CLASS_REG)) {
    const value = decodeHtmlEntities(match[2] ?? "");

    const matchIndex = match.index ?? 0;

    if (matchIndex > 0 && matchEnd < matchIndex) {
      outHtml += html.slice(matchEnd, matchIndex);
    }

    matchEnd = matchIndex + match[0].length;
    outHtml += match[1];

    const expanded = expandTailwindGroups(value);
    if (classNames !== "") classNames += " ";
    classNames += expanded;

    outHtml += encodeHtmlEntities(expanded);
    outHtml += match[3];
  }

  if (matchEnd < html.length) {
    outHtml += html.slice(matchEnd);
  }

  return { classNames, html: outHtml };
}
