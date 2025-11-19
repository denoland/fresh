import * as path from "@std/path";

export function toAbsolutePath(input: string, cwd: string): string {
  if (!path.isAbsolute(input)) {
    return path.join(cwd, input);
  }

  return input;
}
