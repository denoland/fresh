import { defineRoute } from "$fresh/server.ts";

export default defineRoute<{ data: string }>((req, ctx) => {
  return (
    <>
      <h1 class="text-red-600 block">it works</h1>
      {ctx.state.data}
    </>
  );
});
