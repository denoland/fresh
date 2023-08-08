import { MultiHandler } from "$fresh/server.ts";

export const handler: MultiHandler<void> = {
  GET(_req, ctx) {
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
