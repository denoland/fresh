// Note: This internal test utility imports Fresh internals directly by path.
// This package is internal to the monorepo, so cross-package internal imports are acceptable here.
import type { ResolvedFreshConfig } from "../../fresh/src/config.ts";
import { Context } from "../../fresh/src/context.ts";
import { DEFAULT_CONN_INFO } from "../../fresh/src/app.ts";
import type { BuildCache, StaticFile } from "../../fresh/src/build_cache.ts";
import type { ServerIslandRegistry } from "../../fresh/src/context.ts";
import type { Command } from "../../fresh/src/commands.ts";
import {
  fsItemsToCommands,
  type FsRouteFile,
} from "../../fresh/src/fs_routes.ts";

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
      new MockBuildCache<T>([], options.config?.mode ?? "production");

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

export class MockBuildCache<State> implements BuildCache<State> {
  #files: FsRouteFile<State>[];
  root = "";
  clientEntry = "";
  islandRegistry: ServerIslandRegistry = new Map();
  features = { errorOverlay: false };

  constructor(files: FsRouteFile<State>[], mode: "development" | "production") {
    this.features.errorOverlay = mode === "development";
    this.#files = files;
  }

  getEntryAssets(): string[] {
    return [];
  }

  getFsRoutes(): Command<State>[] {
    return fsItemsToCommands(this.#files);
  }

  readFile(_pathname: string): Promise<StaticFile | null> {
    return Promise.resolve(null);
  }
}

export function createFakeFs(files: Record<string, unknown>): {
  cwd: () => string;
  walk: (_root: string) => AsyncGenerator<{
    isDirectory: boolean;
    isFile: boolean;
    isSymlink: boolean;
    name: string;
    path: string;
  }>;
  isDirectory: (dir: string) => Promise<boolean>;
  mkdirp: (_dir: string) => Promise<void>;
  readFile: typeof Deno.readFile;
  readTextFile: (path: string) => Promise<string>;
} {
  return {
    cwd: () => ".",
    async *walk(_root: string) {
      for (const file of Object.keys(files)) {
        const entry = {
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
    async isDirectory(dir: string) {
      return Object.keys(files).some((file) => file.startsWith(dir + "/"));
    },
    async mkdirp(_dir: string) {},
    readFile: Deno.readFile,
    // deno-lint-ignore require-await
    async readTextFile(path: string) {
      return String(files[String(path)]);
    },
  };
}
