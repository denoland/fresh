import { defineHandlers } from "@fresh/core";

export const handler = defineHandlers({
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
});
