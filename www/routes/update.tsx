import { define } from "../utils/state.ts";
import VERSIONS from "../../versions.json" with { type: "json" };

export const handler = define.handlers({
  GET({ request }) {
    const accept = request.headers.get("accept");
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
