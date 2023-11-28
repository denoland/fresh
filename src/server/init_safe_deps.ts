// This file includes dependencies that are safe to use even
// when the user has no `deno.json` in their project folder.
// This commonly occurs when the user is bootstrapping a new
// project.

export {
  isIdentifierChar,
  isIdentifierStart,
} from "https://esm.sh/@babel/helper-validator-identifier@7.22.20";
