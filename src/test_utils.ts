import { FreshReqContext } from "./context.ts";
import { Middleware } from "./middlewares/compose.ts";
import { FsAdapter } from "./fs.ts";
import { WalkEntry } from "@std/fs/walk";

export class FakeServer {
  constructor(public handler: (req: Request) => Response | Promise<Response>) {}

  async get(path: string): Promise<Response> {
    const url = this.toUrl(path);
    const req = new Request(url);
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

export function serveMiddleware<T>(middleware: Middleware<T>): FakeServer {
  return new FakeServer(async (req) => {
    const ctx = new FreshReqContext<T>(
      req,
      {
        build: {
          outDir: "",
          target: "",
        },
        basePath: "",
        root: "",
        mode: "dev",
        staticDir: "",
      },
      async () => await new Response("Not found", { status: 404 }),
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
  };
}
