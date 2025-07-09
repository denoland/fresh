export type Method = "HEAD" | "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export type MethodDefs<T> = { [m in Method | "ALL"]: T | null };

export type StaticRoute<T> = {
  path: string;
  methods: MethodDefs<T>;
};

export interface DynamicRoute<T> {
  path: URLPattern;
  methods: MethodDefs<T>;
}

function newMethodDefs<T>(): MethodDefs<T> {
  return {
    GET: null,
    PATCH: null,
    DELETE: null,
    HEAD: null,
    POST: null,
    PUT: null,
    ALL: null,
  };
}

export interface RouteResult<T> {
  params: Record<string, string>;
  item: T | null;
  methodMatch: boolean;
  pattern: string | null;
}

export interface Router<T> {
  add(method: Method | "ALL", pathname: string, value: T): void;
  match(method: Method, url: URL): RouteResult<T>;
}

export const IS_PATTERN = /[*:{}+?()]/;

export class UrlPatternRouter<T> implements Router<T> {
  #dynamics = new Map<string, DynamicRoute<T>>();
  #statics = new Map<string, StaticRoute<T>>();
  #dynamicsArr: DynamicRoute<T>[] = [];

  add(method: Method | "ALL", pathname: string, value: T) {
    if (IS_PATTERN.test(pathname)) {
      let item = this.#dynamics.get(pathname);
      if (item === undefined) {
        item = {
          path: new URLPattern({ pathname }),
          methods: newMethodDefs(),
        };
        this.#dynamics.set(pathname, item);
      }

      item.methods[method] = value;

      this.#dynamicsArr.push(item);
    } else {
      let item = this.#statics.get(pathname);
      if (item === undefined) {
        item = {
          path: pathname,
          methods: newMethodDefs(),
        };
        this.#statics.set(pathname, item);
      }

      item.methods[method] = value;
    }
  }

  match(method: Method, url: URL): RouteResult<T> {
    const result: RouteResult<T> = {
      params: Object.create(null),
      item: null,
      methodMatch: false,
      pattern: null,
    };

    // Fast path for static routes
    const matchedStatic = this.#statics.get(url.pathname);
    if (matchedStatic !== undefined) {
      result.pattern = matchedStatic.path;

      const value = matchedStatic.methods[method] ?? matchedStatic.methods.ALL;
      if (value !== null) {
        result.methodMatch = true;
        result.item = value;
      }

      return result;
    }

    for (let i = 0; i < this.#dynamicsArr.length; i++) {
      const route = this.#dynamicsArr[i];

      // Fast path
      if (route.path.pathname === "/*") {
        result.pattern = route.path.pathname;

        const value = route.methods[method] ?? route.methods.ALL;
        if (value !== null) {
          result.methodMatch = true;
          result.item = value;
        }

        return result;
      }

      const match = route.path.exec(url);
      if (match !== null) {
        result.pattern = route.path.pathname;

        const value = route.methods[method] ?? route.methods.ALL;
        if (value !== null) {
          result.methodMatch = true;
          result.item = value;

          // Decode matched params
          for (const [key, value] of Object.entries(match.pathname.groups)) {
            result.params[key] = value === undefined ? "" : decodeURI(value);
          }
        }

        return result;
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
