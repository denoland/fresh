import type { FreshContext, MiddlewareHandler } from "$fresh/server.ts";

// cors middleware
async function corsHandler(_req: Request, ctx: FreshContext) {
  if (_req.method == "OPTIONS") {
    return new Response(null, {
      status: 204,
    });
  }
  const origin = _req.headers.get("Origin") || "*";
  const resp = await ctx.next();
  const headers = resp.headers;

  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
  headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With",
  );
  headers.set(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS, GET, PUT, DELETE",
  );

  return resp;
}

// log middleware
async function logHandler(_req: Request, ctx: FreshContext) {
  const since = new Date();
  const resp = await ctx.next();
  const latency = (+new Date()) - (+since);
  resp.headers.set("latency", `${latency}`);
  return resp;
}

async function rootHandler(_req: Request, ctx: FreshContext) {
  ctx.state.root = "root_mw";
  const resp = await ctx.next();
  resp.headers.set("server", "fresh test server");
  return resp;
}

async function kindHandler(_req: Request, ctx: FreshContext) {
  const resp = await ctx.next();
  resp.headers.set("destination", ctx.destination);
  return resp;
}

export const handler: MiddlewareHandler | MiddlewareHandler[] = [
  rootHandler,
  logHandler,
  kindHandler,
  corsHandler,
];
