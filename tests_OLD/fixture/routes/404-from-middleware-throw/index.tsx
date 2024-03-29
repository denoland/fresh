import { defineRoute } from "$fresh/server.ts";

export default defineRoute((req, ctx) => {
  return "This never gets shown, because the middleware throws an error.";
});
