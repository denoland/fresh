import { ServerContext } from "./context.ts";
import { router } from "./deps.ts";
import { ApiRouteModule, PageModule, RendererModule } from "./types.ts";
export { RenderContext } from "./render.tsx";
export type { RenderFn } from "./render.tsx";

export interface Routes {
  pages: Record<string, PageModule | ApiRouteModule | RendererModule>;
  baseUrl: string;
}

export { router, ServerContext };

export function start(routes: Routes) {
  const ctx = ServerContext.fromRoutes(routes);
  const app = router.router(ctx.routes());
  serve(app);
}

async function serve(handler: (req: Request) => Response | Promise<Response>) {
  async function handleConn(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    for await (const e of httpConn) {
      e.respondWith(handler(e.request))
        .catch((e) => console.error("Failed handing a request:", e));
    }
  }

  const listener = Deno.listen({ port: 8000 });
  const addr = listener.addr as Deno.NetAddr;
  console.log(`Listening on http://${addr.hostname}:${addr.port}`);
  for await (const conn of listener) {
    handleConn(conn)
      .catch((e) => console.error("Failed serving a connection:", e));
  }
}
