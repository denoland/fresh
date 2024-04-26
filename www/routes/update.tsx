import VERSIONS from "../../versions.json" with { type: "json" };
import { helpers } from "../utils.ts";

export const handler = helpers.defineHandlers({
  GET(ctx) {
    const accept = ctx.req.headers.get("accept");
    let path = "/docs/concepts/updating";
    if (accept && !accept.includes("text/html")) {
      path = `https://deno.land/x/fresh@${VERSIONS[0]}/update.ts`;
    }
    return new Response(`Redirecting to ${path}`, {
      headers: { "Location": path },
      status: 307,
    });
  },
});
