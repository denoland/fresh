import type { MiddlewareFn } from "./mod.ts";
import type { Method } from "./router.ts";

export const enum PartType {
  Route,
  Layout,
  Middleware,
  Error,
}

export interface RouteDef<T> {
  isGroup: boolean;
  path: string | RegExp;
  method: Method | "ALL";
  next: RouteDef<T>[];
  middlewares: MiddlewareFn<T>[];
  error: null;
  layout: null;
}

function addRoutePart<T>(
  root: RouteDef<T>,
  method: Method | "ALL",
  pathname: string,
  handlers: T[],
  type: PartType,
) {
  if (pathname === "") {
  }
}

export const enum PatternToken2 {
  Slash, // /
  Static, // foo
  Regex, // (foo|bar)
  Param, // :books
  NonCapturing, // {foo}
  WildCard, // *
  Optional, // ?
  EOF,
}

export const enum Token {
  Word, // Everything that's not a control character
  Slash, // /
  Colon, // :
  Asteriks, // *
  Question, // ?
  CurlyOpen, // {
  CurlyClose, // }
  BraceOpen, // (
  BraceClose, // )
  EOF,
}

export interface PatternPart {
  token: Token;
  value: string;
}

const STATIC_TERMINATOR = /[:/{}*:?()-]/;

const EMPTY_STR = "";

export class PatternLexer {
  input = "";
  token: Token = Token.Word;
  value = EMPTY_STR;
  i = -1;

  next() {
    let escaped = false;
    const start = this.i + 1;
    this.value = EMPTY_STR;

    while (this.i + 1 < this.input.length) {
      console.log("loop", this.input, this.i, this.input.slice(this.i));
      this.i++;

      if (escaped) {
        escaped = false;
        continue;
      }

      const ch = this.input[this.i];
      if (ch === "\\") {
        escaped = true;
        continue;
      }

      switch (ch) {
        case "/":
          this.token = Token.Slash;
          return;
        case ":":
          this.token = Token.Colon;
          return;
        case "*":
          this.token = Token.Asteriks;
          return;
        case "?":
          this.token = Token.Question;
          return;
        case "{":
          this.token = Token.CurlyOpen;
          return;
        case "}":
          this.token = Token.CurlyClose;
          return;
        case "(":
          this.token = Token.BraceOpen;
          return;
        case ")":
          this.token = Token.BraceClose;
          return;
      }

      // Peek next
      if (this.i + 1 < this.input.length) {
        const next = this.input[this.i + 1];
        if (STATIC_TERMINATOR.test(next)) {
          this.token = Token.Word;
          this.value = this.input.slice(start, this.i + 1);
          return;
        }
      } else if (this.i + 1 === this.input.length) {
        this.token = Token.Word;
        this.value = this.input.slice(start);
        return;
      }
    }

    this.token = Token.EOF;
  }
}

export function splitPattern(pattern: string): PatternPart[] {
  if (pattern === "") {
    throw new Error(`Received empty string as route pattern.`);
  }
  if (pattern === "/") {
    return [{
      token: "static",
      value: "/",
    }];
  }

  const parts: PatternPart[] = [];

  const len = pattern.length;

  let curlyBraceCount = 0;
  let escaped = false;

  let start = -1;
  for (let i = 0; i < len; i++) {
    const ch = pattern[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === "/" && curlyBraceCount === 0) {
      if (start > -1) {
        parts.push(pattern.slice(start, i));
      }
      start = i;
      continue;
    } else if (ch === "{") {
      start = i;

      curlyBraceCount++;
      continue;
    } else if (ch === "}") {
      curlyBraceCount--;
    }
  }

  parts.push(pattern.slice(start));

  return parts;
}

export function matchRoute<T>(root: RouteDef<T>) {
}
