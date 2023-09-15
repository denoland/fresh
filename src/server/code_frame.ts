import { colors, fromFileUrl } from "./deps.ts";

/**
 * Convert tabs indentation to two spaces.
 */
function tabs2Spaces(str: string) {
  return str.replace(/^\t+/, (tabs) => "  ".repeat(tabs.length));
}

export interface Options {
  before?: number;
  after?: number;
  maxWidth?: number;
  lineMarkerChar?: string;
  seperatorChar?: string;
  columnMarkerChar?: string;
}

/**
 * Generate an excerpt of the location in the source around the
 * specified position.
 * Taken from: https://github.com/marvinhagemeister/simple-code-frame/blob/e56f10acf2de6ece968b0de67d2d34e445dc8a66/src/index.ts
 */
export function createCodeFrame(
  text: string,
  lineNum: number,
  columnNum: number,
  {
    before = 2,
    after = 3,
    maxWidth = 0,
    lineMarkerChar = ">",
    seperatorChar = "|",
    columnMarkerChar = "^",
  }: Options = {},
) {
  const lines = text.split("\n");

  const start = Math.max(0, lineNum - before);
  const end = Math.min(lines.length, lineNum + after + 1);

  // Maximum space needed for line numbering in the current range.
  // Necessary when the amount of digits of the line numbering grows:
  //  999 | asdf
  // 1000 | asdjadfjsa
  const maxLineNum = String(end).length;
  const padding = " ".repeat(maxLineNum);

  // Normalize all indentation (=tabs) to use 2 spaces. We need to
  // apply the difference to the marker position to move it back in
  // place.
  const spaceLines: string[] = [];
  let maxLineLen = 0;
  for (let i = start; i < end; i++) {
    const line = tabs2Spaces(lines[i]);
    spaceLines.push(line);

    if (line.length > maxLineLen) maxLineLen = line.length;
  }

  const activeLine = spaceLines[lineNum - start];
  // Move marker into correct place by taking the amount of
  // normalized tabs into account
  const count = Math.max(
    0,
    activeLine.length - lines[lineNum].length + columnNum,
  );

  const maxLensWidth = maxWidth - "> ".length - padding.length - " | ".length;

  let left = 0;
  let right = maxLensWidth;
  if (maxWidth > 0) {
    const half = Math.floor(maxLensWidth / 2);
    const winLeft = count - half;
    if (winLeft > 0) {
      const winRight = count + half - 1;
      left = winLeft;
      right = winRight;

      if (winRight > maxLensWidth) {
        const offset = Math.min(0, winRight - maxLensWidth);
        left -= offset;
        right -= offset;
      }
    }
  }

  const sep = colors.dim(seperatorChar);
  let out = "";

  for (let i = 0; i < spaceLines.length; i++) {
    const line = spaceLines[i];
    const currentLine = colors.dim(
      (padding + (i + start + 1)).slice(-maxLineNum),
    );
    let formatted = line;

    if (maxWidth > 0) {
      formatted = formatted.slice(left, Math.min(right, line.length));

      if (left > 0) {
        formatted = "…" + formatted;
      }

      if (line.length > right) {
        formatted += "…";
      }
    }

    // Line where the error occured
    if (i === lineNum - start) {
      out += colors.red(lineMarkerChar) +
        ` ${currentLine} ${sep} ${formatted}\n`;

      out += `  ${padding} ${sep} ${" ".repeat(count - left)}${
        colors.bold(
          colors.red(columnMarkerChar),
        )
      }\n`;
    } else {
      out += `  ${currentLine} ${sep} ${formatted}\n`;
    }
  }

  return out;
}

const STACK_FRAME = /^\s*at\s+(?:(.*)\s+)\((.*):(\d+):(\d+)\)$/;
export interface StackFrame {
  fnName: string;
  file: string;
  line: number;
  column: number;
}
export function getFirstUserFile(stack: string): StackFrame | undefined {
  const lines = stack.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(STACK_FRAME);
    if (match) {
      return {
        fnName: match[1],
        file: match[2],
        line: +match[3],
        column: +match[4],
      };
    }
  }
}

export async function getCodeFrame(error: Error) {
  if (!error.stack) return;

  const file = getFirstUserFile(error.stack);
  if (file) {
    try {
      const filePath = fromFileUrl(file.file);
      const text = await Deno.readTextFile(filePath);
      return createCodeFrame(
        text,
        file.line - 1,
        file.column - 1,
      );
    } catch {
      // Ignore
    }
  }
}
