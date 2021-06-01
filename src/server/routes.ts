import { extname, oak } from "./deps.ts";
import * as rt from "../runtime/deps.ts";
import { PageProps } from "../runtime/types.ts";

export interface PageModule {
  default: rt.ComponentType<PageProps>;
}

export interface APIModule {
  default: oak.Route;
}

export interface Page {
  route: string;
  url: string;
  name: string;
  component: rt.ComponentType<PageProps>;
}

export interface API {
  route: string;
  url: string;
  name: string;
  handler: oak.RouterMiddleware<Record<string, string>>;
}

export function createPages(
  pageModules: [PageModule, string][],
  baseUrl: string,
): Page[] {
  const pages: Page[] = [];
  for (const [pageModule, self] of pageModules) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("Page is not a child of the basepath.");
    }
    const path = url.substring(baseUrl.length).substring("pages".length);
    const name = path.substring(1, path.length - extname(path).length);
    const route = pathToRoute(name);
    const page: Page = {
      route,
      url,
      name: name.replace("/", "-"),
      component: pageModule.default,
    };
    pages.push(page);
  }

  pages.sort((a, b) => {
    const partsA = a.route.split("/");
    const partsB = b.route.split("/");
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i];
      const partB = partsB[i];
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;
      if (partA === partB) continue;
      const priorityA = partA.startsWith(":") ? partA.endsWith("*") ? 0 : 1 : 2;
      const priorityB = partB.startsWith(":") ? partB.endsWith("*") ? 0 : 1 : 2;
      return Math.max(Math.min(priorityB - priorityA, 1), -1);
    }
    return 0;
  });

  return pages;
}

export function createAPIs(
  apiModules: [APIModule, string][],
  baseUrl: string,
): API[] {
  const apis: API[] = [];
  for (const [apiModule, self] of apiModules) {
    const url = new URL(self, baseUrl).href;
    if (!url.startsWith(baseUrl)) {
      throw new TypeError("API is not a child of the basepath.");
    }
    const path = url.substring(baseUrl.length).substring("pages".length);
    const name = path.substring(1, path.length - extname(path).length);
    const route = pathToRoute(name);
    const api: API = {
      route,
      url,
      name: name.replace("/", "-"),
      handler: apiModule.default,
    };
    apis.push(api);
  }

  apis.sort((a, b) => {
    const partsA = a.route.split("/");
    const partsB = b.route.split("/");
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const partA = partsA[i];
      const partB = partsB[i];
      if (partA === undefined) return -1;
      if (partB === undefined) return 1;
      if (partA === partB) continue;
      const priorityA = partA.startsWith(":") ? partA.endsWith("*") ? 0 : 1 : 2;
      const priorityB = partB.startsWith(":") ? partB.endsWith("*") ? 0 : 1 : 2;
      return Math.max(Math.min(priorityB - priorityA, 1), -1);
    }
    return 0;
  });

  return apis;
}

function pathToRoute(path: string): string {
  const parts = path.split("/");
  if (parts[parts.length - 1] === "index") {
    parts.pop();
  }
  const route = "/" + parts
    .map((part) => {
      if (part.startsWith("[...") && part.endsWith("]")) {
        return `:${part.slice(4, part.length - 1)}*`;
      }
      if (part.startsWith("[") && part.endsWith("]")) {
        return `:${part.slice(1, part.length - 1)}`;
      }
      return part;
    })
    .join("/");
  return route;
}
