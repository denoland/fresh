export type Method =
  | "HEAD"
  | "GET"
  | "POST"
  | "PATCH"
  | "PUT"
  | "DELETE"
  | "OPTIONS";

export interface RouteDef<T> {
  method: Method | "ALL";
  pattern: string | URLPattern;
  handlers: T[];
}

export interface RouteResult<T> {
  params: Record<string, string>;
  handlers: T[];
  methodMatch: boolean;
  patternMatch: boolean;
  pattern: string | null;
}

export interface Router<T> {
  add(method: Method | "OPTIONS" | "ALL", pathname: string, value: T): void;
  match(method: Method, url: URL, init?: T[]): RouteResult<T>;
}

export const IS_PATTERN = /[*:{}+?()]/;

export class UrlPatternRouter<T> implements Router<T> {
  #routes: RouteDef<T>[] = [];

  add(method: Method | "ALL", pathname: string, value: T) {
    const last = this.#routes.at(-1);

    if (IS_PATTERN.test(pathname)) {
      if (
        last !== undefined && last.method === method &&
        typeof last.pattern !== "string" && last.pattern.pathname === pathname
      ) {
        last.handlers.push(value);
      } else {
        const pattern = new URLPattern({ pathname });
        this.#routes.push({ method, pattern, handlers: [value] });
      }
    } else if (
      last !== undefined && last.method === method &&
      last.pattern === pathname
    ) {
      last.handlers.push(value);
    } else {
      this.#routes.push({ method, pattern: pathname, handlers: [value] });
    }
  }

  match(method: Method, url: URL, init: T[] = []): RouteResult<T> {
    const result: RouteResult<T> = {
      params: Object.create(null),
      handlers: init,
      methodMatch: false,
      patternMatch: false,
      pattern: null,
    };

    for (let i = 0; i < this.#routes.length; i++) {
      const route = this.#routes[i];

      if (typeof route.pattern === "string") {
        if (route.pattern === url.pathname) {
          result.patternMatch = true;

          if (route.method === method) {
            result.methodMatch = true;

            result.handlers.push(...route.handlers);

            if (result.pattern === null) {
              result.pattern = route.pattern;
            }
          }
        }
      } else {
        const match = route.pattern.exec(url.pathname);
        if (match !== null) {
          result.patternMatch = true;

          if (route.method === method) {
            result.methodMatch = true;
            result.handlers.push(...route.handlers);

            // Decode matched params
            for (const [key, value] of Object.entries(match.pathname.groups)) {
              result.params[key] = value === undefined ? "" : decodeURI(value);
            }

            if (result.pattern === null) {
              result.pattern = route.pattern.pathname;
            }
          }
        }
      }
    }

    return result;
  }
}

/**
 * Transform a filesystem URL path to a `path-to-regex` style matcher.
 */
export function pathToPattern(
  path: string,
  options?: { keepGroups: boolean },
): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    if (parts.length === 1) {
      return "/";
    }
    parts.pop();
  }

  let route = "";

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    // Case: /[...foo].tsx
    if (part.startsWith("[...") && part.endsWith("]")) {
      route += `/:${part.slice(4, part.length - 1)}*`;
      continue;
    }

    // Route groups like /foo/(bar) should not be included in URL
    // matching. They are transparent and need to be removed here.
    // Case: /foo/(bar) -> /foo
    // Case: /foo/(bar)/bob -> /foo/bob
    // Case: /(foo)/bar -> /bar
    if (!options?.keepGroups && part.startsWith("(") && part.endsWith(")")) {
      continue;
    }

    // Disallow neighbouring params like `/[id][bar].tsx` because
    // it's ambiguous where the `id` param ends and `bar` begins.
    if (part.includes("][")) {
      throw new SyntaxError(
        `Invalid route pattern: "${path}". A parameter cannot be followed by another parameter without any characters in between.`,
      );
    }

    // Case: /[[id]].tsx
    // Case: /[id].tsx
    // Case: /[id]@[bar].tsx
    // Case: /[id]-asdf.tsx
    // Case: /[id]-asdf[bar].tsx
    // Case: /asdf[bar].tsx
    let pattern = "";
    let groupOpen = 0;
    let optional = false;
    for (let j = 0; j < part.length; j++) {
      const char = part[j];
      if (char === "[") {
        if (part[j + 1] === "[") {
          // Disallow optional dynamic params like `foo-[[bar]]`
          if (part[j - 1] !== "/" && !!part[j - 1]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen++;
          optional = true;
          pattern += "{/";
          j++;
        }
        pattern += ":";
        groupOpen++;
      } else if (char === "]") {
        if (part[j + 1] === "]") {
          // Disallow optional dynamic params like `[[foo]]-bar`
          if (part[j + 2] !== "/" && !!part[j + 2]) {
            throw new SyntaxError(
              `Invalid route pattern: "${path}". An optional parameter needs to be a full segment.`,
            );
          }
          groupOpen--;
          pattern += "}?";
          j++;
        }
        if (--groupOpen < 0) {
          throw new SyntaxError(`Invalid route pattern: "${path}"`);
        }
      } else {
        pattern += char;
      }
    }

    route += (optional ? "" : "/") + pattern;
  }

  // Case: /(group)/index.tsx
  if (route === "") {
    route = "/";
  }

  return route;
}

export function patternToSegments(path: string, root: string): string[] {
  const out: string[] = [root];

  if (path === "/") return out;

  let start = -1;
  for (let i = 0; i < path.length; i++) {
    const ch = path[i];

    if (ch === "/") {
      if (i > 0) {
        const raw = path.slice(start + 1, i);
        out.push(raw);
      }
      start = i;
    }
  }

  if (start > -1) {
    const raw = path.slice(start + 1);
    out.push(raw);
  }

  return out;
}
