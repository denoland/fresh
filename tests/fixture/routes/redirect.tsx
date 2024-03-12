import { FreshContext } from "$fresh/server.ts";

export const handler = {
  GET(_req: Request, ctx: FreshContext) {
    const rawStatus = ctx.url.searchParams.get("status");
    const status = rawStatus !== null ? Number(rawStatus) : undefined;
    const location = ctx.url.searchParams.get("path") ?? "/";
    return ctx.redirect(location, status);
  },
};
