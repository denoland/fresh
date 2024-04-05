import { FreshReqContext } from "./context.ts";
import type { Middleware } from "./middlewares/mod.ts";
import type { FsAdapter } from "./fs.ts";
import { type BuildCache, ProdBuildCache } from "./build_cache.ts";
import type { ResolvedFreshConfig } from "./config.ts";
import type { WalkEntry } from "@std/fs/walk";

export class FakeServer {
  constructor(public handler: (req: Request) => Response | Promise<Response>) {}

  async get(path: string, init?: RequestInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, init);
    return await this.handler(req);
  }
  async post(path: string, body?: BodyInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "post", body });
    return await this.handler(req);
  }
  async patch(path: string, body?: BodyInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "patch", body });
    return await this.handler(req);
  }
  async put(path: string, body?: BodyInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "put", body });
    return await this.handler(req);
  }
  async delete(path: string): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "delete" });
    return await this.handler(req);
  }
  async head(path: string): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "head" });
    return await this.handler(req);
  }

  private toUrl(path: string) {
    return new URL(path, "http://localhost/");
  }
}

const DEFAULT_CONFIG: ResolvedFreshConfig = {
  build: {
    outDir: "",
  },
  mode: "production",
  basePath: "",
  root: "",
  staticDir: "",
};

export function serveMiddleware<T>(
  middleware: Middleware<T>,
  options: {
    buildCache?: BuildCache;
    next?: () => Response | Promise<Response>;
    config?: ResolvedFreshConfig;
  } = {},
): FakeServer {
  return new FakeServer(async (req) => {
    const config = options.config ?? DEFAULT_CONFIG;

    const next = options.next ??
      (() => new Response("not found", { status: 404 }));
    const ctx = new FreshReqContext<T>(
      req,
      config,
      () => Promise.resolve(next()),
      options.buildCache ?? new ProdBuildCache(config, new Map(), new Map()),
      new Map(),
    );
    return await middleware(ctx);
  });
}

export function createFakeFs(files: Record<string, unknown>): FsAdapter {
  return {
    async *walk(_root) {
      // FIXME: ignore
      for (const file of Object.keys(files)) {
        const entry: WalkEntry = {
          isDirectory: false,
          isFile: true,
          isSymlink: false,
          name: file, // FIXME?
          path: file,
        };
        yield entry;
      }
    },
    // deno-lint-ignore require-await
    async isDirectory(dir) {
      return Object.keys(files).some((file) => file.startsWith(dir + "/"));
    },
    async mkdirp(_dir: string) {
    },
    readFile: Deno.readFile,
  };
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
