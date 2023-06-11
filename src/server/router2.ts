export type KnownMethod = typeof knownMethods[number];

export const knownMethods = [
  "HEAD",
  "GET",
  "POST",
  "PUT",
  "DELETE",
  "OPTIONS",
  "PATCH",
] as const;

export interface RouterRoute<T> {
  pattern: URLPattern;
  methods: Map<KnownMethod, T>;
  default?: T;
}

export class URLRouter<T> {
  #routes: RouterRoute<T>[];

  constructor(routes: RouterRoute<T>[]) {
    this.#routes = routes;
  }

  match(url: string, method: string): [T, URLPatternResult] | null {
    for (const route of this.#routes) {
      const match = route.pattern.exec(url);
      if (match !== null) {
        const handler = route.methods.get(method as KnownMethod) ||
          route.default;
        if (handler !== undefined) return [handler, match];
      }
    }
    return null;
  }
}

export interface ManyRouterRoute<T> {
  pattern: URLPattern;
  handler: T;
}

export class URLManyRouter<T> {
  #routes: ManyRouterRoute<T>[];

  constructor(routes: ManyRouterRoute<T>[]) {
    this.#routes = routes;
  }

  matchAll(url: string) {
    const matches: [T, URLPatternResult][] = [];
    for (const route of this.#routes) {
      const match = route.pattern.exec(url);
      if (match !== null) {
        matches.push([route.handler, match]);
      }
    }
    return matches;
  }
}
