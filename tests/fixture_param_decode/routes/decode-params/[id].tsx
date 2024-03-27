import { defineRoute } from "$fresh/src/server/defines.ts";

export default defineRoute((req, ctx) => {
  return ctx.params.id;
});
