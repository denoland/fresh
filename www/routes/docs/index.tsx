import type { Handler } from "@fresh/core/compat";

export const handler: Handler<void> = {
  GET(ctx) {
    const slug = ctx.params.slug;

    if (slug === "concepts/architechture") {
      return new Response("", {
        status: 307,
        headers: { location: "/docs/concepts/architecture" },
      });
    }

    return new Response("", {
      status: 307,
      headers: { location: "/docs/introduction" },
    });
  },
};
