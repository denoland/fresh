import * as pathPosix from "@std/path/posix";
import * as path from "@std/path";

export type FileUrl = string & { readonly __brand: unique symbol };

export function pathToFileUrl(str: string): FileUrl {
  if (str.startsWith("file://")) {
    // all good
  } else if (path.isAbsolute(str)) {
    str = path.toFileUrl(str).href;
  } else {
    throw new Error(`Cannot convert "${str}" to file:// url`);
  }

  return str as FileUrl;
}

export function relativeUrl(from: FileUrl, to: FileUrl): string {
  return pathPosix.relative(from, to);
}
