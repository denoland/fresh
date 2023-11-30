import { defineRoute } from "$fresh/server.ts";

export default defineRoute((_req, ctx) => {
  return (
    <h1>
      {typeof ctx.config.staticDir === "string"
        ? "it works"
        : "it doesn't work"}
    </h1>
  );
});
