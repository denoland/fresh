// deno-lint-ignore-file require-await
import { createContext } from "./context.ts";
import { Middleware } from "./middlewares/compose.ts";

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

  private toUrl(path: string) {
    return new URL(path, "http://localhost/");
  }
}

export function serveMiddleware<T>(middleware: Middleware<T>): FakeServer {
  return new FakeServer(async (req) => {
    const ctx = createContext<T>(
      req,
      {
        basePath: "",
        dir: "",
        load: () => Promise.resolve(),
        mode: "dev",
        staticDir: "",
      },
      async () => new Response("Not found", { status: 404 }),
    );
    return await middleware(ctx);
  });
}
