import { colors, fromFileUrl } from "./deps.ts";

function tabs2Spaces(str: string) {
  return str.replace(/^\t+/, (tabs) => "  ".repeat(tabs.length));
}

/**
 * Generate an excerpt of the location in the source around the
 * specified position.
 */
export function createCodeFrame(
  text: string,
  lineNum: number,
  columnNum: number,
): string | undefined {
  // Default settings
  const before = 2;
  const after = 3;

  const lines = text.split("\n");

  // Check if specified range is valid
  if (lines.length <= lineNum || lines[lineNum].length < columnNum) {
    return;
  }

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

  const sep = colors.dim("|");
  let out = "";

  for (let i = 0; i < spaceLines.length; i++) {
    const line = spaceLines[i];
    const currentLine = colors.dim(
      (padding + (i + start + 1)).slice(-maxLineNum),
    );

    // Line where the error occurred
    if (i === lineNum - start) {
      out += colors.red(">") +
        ` ${currentLine} ${sep} ${line}\n`;

      const columnMarker = colors.bold(colors.red("^"));
      out += `  ${padding} ${sep} ${" ".repeat(count)}${columnMarker}\n`;
    } else {
      out += `  ${currentLine} ${sep} ${line}\n`;
    }
  }

  return out;
}

const STACK_FRAME = /^\s*at\s+(?:(.*)\s+)?\((.*):(\d+):(\d+)\)$/;
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
    if (match && match) {
      const fnName = match[1] ?? "";
      const file = match[2];
      const line = +match[3];
      const column = +match[4];

      if (file.startsWith("file://")) {
        return {
          fnName,
          file,
          line,
          column,
        };
      }
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
