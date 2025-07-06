export type Method = "HEAD" | "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface Route<T> {
  path: string | URLPattern;
  method: Method | "ALL";
  item: T;
}

export interface RouteResult<T> {
  params: Record<string, string>;
  item: T | null;
  methodMatch: boolean;
  patternMatch: boolean;
  pattern: string | null;
}

export interface Router<T> {
  add(
    method: Method | "ALL",
    pathname: string | URLPattern,
    item: T,
  ): void;
  match(method: Method, url: URL): RouteResult<T>;
}

export const IS_PATTERN = /[*:{}+?()]/;

export class UrlPatternRouter<T> implements Router<T> {
  #routes: Route<T>[] = [];

  add(method: Method | "ALL", pathname: string | URLPattern, item: T) {
    console.log("ADD", method, pathname);
    if (
      typeof pathname === "string" && pathname !== "/*" &&
      IS_PATTERN.test(pathname)
    ) {
      this.#routes.push({
        path: new URLPattern({ pathname }),
        item,
        method,
      });
    } else {
      this.#routes.push({
        path: pathname,
        item,
        method,
      });
    }
  }

  match(method: Method, url: URL): RouteResult<T> {
    const result: RouteResult<T> = {
      params: Object.create(null),
      item: null,
      methodMatch: false,
      patternMatch: false,
      pattern: null,
    };

    for (let i = 0; i < this.#routes.length; i++) {
      const route = this.#routes[i];

      // Fast path for string based routes which are expected
      // to be either wildcard `*` match or an exact pathname match.
      if (
        typeof route.path === "string" &&
        (route.path === "/*" || route.path === url.pathname)
      ) {
        if (route.method !== "ALL") result.patternMatch = true;
        result.pattern = route.path;

        if (route.method === "ALL" || route.method === method) {
          result.methodMatch = true;
          result.item = route.item;

          return result;
        }
      } else if (route.path instanceof URLPattern) {
        const match = route.path.exec(url);
        if (match !== null) {
          if (route.method !== "ALL") result.patternMatch = true;
          result.pattern = route.path.pathname;

          if (route.method === "ALL" || route.method === method) {
            result.item = route.item;

            // Decode matched params
            for (const [key, value] of Object.entries(match.pathname.groups)) {
              result.params[key] = value === undefined ? "" : decodeURI(value);
            }

            result.methodMatch = true;
            return result;
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
export function pathToPattern(path: string): string {
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
    if (part.startsWith("(") && part.endsWith(")")) {
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
