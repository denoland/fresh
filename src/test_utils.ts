import { Context, type ServerIslandRegistry } from "./context.ts";
import type { FsAdapter } from "./fs.ts";
import type { BuildCache, StaticFile } from "./build_cache.ts";
import type { ResolvedFreshConfig } from "./config.ts";
import type { WalkEntry } from "@std/fs/walk";
import { DEFAULT_CONN_INFO } from "./app.ts";
import type { Command } from "./commands.ts";
import { fsItemsToCommands, type FsRouteFile } from "./fs_routes.ts";
import * as path from "@std/path";

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
  async options(path: string): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url, { method: "options" });
    return await this.handler(req, STUB);
  }

  async request(req: Request): Promise<Response> {
    return await this.handler(req, STUB);
  }

  private toUrl(path: string) {
    return new URL(path, "http://localhost/");
  }
}

const DEFAULT_CONFIG: ResolvedFreshConfig = {
  root: "",
  mode: "production",
  basePath: "",
};

export function serveMiddleware<T>(
  middleware: (ctx: Context<T>) => Response | Promise<Response>,
  options: {
    config?: ResolvedFreshConfig;
    buildCache?: BuildCache<T>;
    next?: () => Promise<Response>;
    route?: string | null;
  } = {},
): FakeServer {
  return new FakeServer(async (req) => {
    const next = options.next ??
      (() => new Response("not found", { status: 404 }));
    const config = options.config ?? DEFAULT_CONFIG;
    const buildCache = options.buildCache ??
      new MockBuildCache<T>([]);

    const ctx = new Context<T>(
      req,
      new URL(req.url),
      DEFAULT_CONN_INFO,
      options.route ?? null,
      {},
      config,
      () => Promise.resolve(next()),
      buildCache,
    );
    return await middleware(ctx);
  });
}

export function createFakeFs(files: Record<string, unknown>): FsAdapter {
  return {
    cwd: () => ".",
    async *walk(_root) {
      for (const file of Object.keys(files)) {
        const entry: WalkEntry = {
          isDirectory: false,
          isFile: true,
          isSymlink: false,
          name: file,
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
    // deno-lint-ignore require-await
    async readTextFile(path) {
      return String(files[String(path)]);
    },
  };
}

export const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function withTmpDir(
  options?: Deno.MakeTempOptions,
): Promise<{ dir: string } & AsyncDisposable> {
  const dir = await Deno.makeTempDir(options);
  return {
    dir,
    async [Symbol.asyncDispose]() {
      try {
        await Deno.remove(dir, { recursive: true });
      } catch {
        // Ignore errors Files in tmp will be cleaned up by the OS
      }
    },
  };
}

export class MockBuildCache<State> implements BuildCache<State> {
  #files: FsRouteFile<State>[];
  root = "";
  islandRegistry: ServerIslandRegistry = new Map();

  constructor(files: FsRouteFile<State>[]) {
    this.#files = files;
  }

  getFsRoutes(): Command<State>[] {
    return fsItemsToCommands(this.#files);
  }

  readFile(_pathname: string): Promise<StaticFile | null> {
    return Promise.resolve(null);
  }
}

export async function writeFiles(dir: string, files: Record<string, string>) {
  const entries = Object.entries(files);
  await Promise.all(entries.map(async (entry) => {
    const [pathname, content] = entry;
    const fullPath = path.join(dir, pathname);
    try {
      await Deno.mkdir(path.dirname(fullPath), { recursive: true });
      await Deno.writeTextFile(fullPath, content);
    } catch (err) {
      if (!(err instanceof Deno.errors.AlreadyExists)) {
        throw err;
      }
    }
  }));
}
