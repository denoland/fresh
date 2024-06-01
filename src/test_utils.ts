import { FreshReqContext } from "./context.ts";
import type { FsAdapter } from "./fs.ts";
import { type BuildCache, ProdBuildCache } from "./build_cache.ts";
import type { ResolvedFreshConfig } from "./config.ts";
import type { WalkEntry } from "@std/fs/walk";
import { DEFAULT_CONN_INFO } from "./app.ts";

const STUB = {} as unknown as Deno.ServeHandlerInfo;

export class FakeServer {
  constructor(
    public handler: (
      req: Request,
      info: Deno.ServeHandlerInfo,
    ) => Response | Promise<Response>,
  ) {}

  async get(path: string, init?: RequestInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, init);
    return await this.handler(req, STUB);
  }
  async post(path: string, body?: BodyInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "post", body });
    return await this.handler(req, STUB);
  }
  async patch(path: string, body?: BodyInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "patch", body });
    return await this.handler(req, STUB);
  }
  async put(path: string, body?: BodyInit): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "put", body });
    return await this.handler(req, STUB);
  }
  async delete(path: string): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "delete" });
    return await this.handler(req, STUB);
  }
  async head(path: string): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "head" });
    return await this.handler(req, STUB);
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
  middleware: (ctx: FreshReqContext<T>) => Response | Promise<Response>,
  options: {
    config?: ResolvedFreshConfig;
    buildCache?: BuildCache;
    next?: () => Promise<Response>;
  } = {},
): FakeServer {
  return new FakeServer(async (req) => {
    const next = options.next ??
      (() => new Response("not found", { status: 404 }));
    const config = options.config ?? DEFAULT_CONFIG;
    const buildCache = options.buildCache ??
      new ProdBuildCache(config, new Map(), new Map(), true);

    const ctx = new FreshReqContext<T>(
      req,
      DEFAULT_CONN_INFO,
      {},
      config,
      () => Promise.resolve(next()),
      new Map(),
      buildCache,
    );
    return await middleware(ctx);
  });
}

export function createFakeFs(files: Record<string, unknown>): FsAdapter {
  for (const filePath of Object.keys(files)) {
    if (!filePath.startsWith("/")) {
      throw new Error(`File path must start with /: ${filePath}`);
    }
  }

  return {
    cwd: () => "/",
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
