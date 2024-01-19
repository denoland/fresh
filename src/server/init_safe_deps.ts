// This file includes dependencies that are safe to use even
// when the user has no `deno.json` in their project folder.
// This commonly occurs when the user is bootstrapping a new
// project.

export {
  isIdentifierChar,
  isIdentifierStart,
} from "https://esm.sh/@babel/helper-validator-identifier@7.22.20";
import {
  isIdentifierChar,
  isIdentifierStart,
} from "https://esm.sh/@babel/helper-validator-identifier@7.22.20";

export function stringToIdentifier(str: string): string {
  let ident = "";
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    if (i === 0 && !isIdentifierStart(char)) {
      ident += "_";
      if (isIdentifierChar(char)) {
        ident += str[i];
      }
    } else if (!isIdentifierChar(char)) {
      if (ident[ident.length - 1] !== "_") {
        ident += "_";
      }
    } else if (ident[ident.length - 1] !== "_" || str[i] !== "_") {
      ident += str[i];
    }
  }

  return ident;
}
