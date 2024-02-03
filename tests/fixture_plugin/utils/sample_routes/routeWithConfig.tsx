import { defineRoute } from "$fresh/server.ts";

export default defineRoute((req, ctx) => {
  return "This is a basic route.";
});
