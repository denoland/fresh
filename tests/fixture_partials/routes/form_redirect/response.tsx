import { Partial } from "$fresh/runtime.ts";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  POST(_req, ctx) {
    return ctx.render();
  },
};

export default function Res() {
  return (
    <Partial name="slot-1">
      <p class="success">it works</p>
    </Partial>
  );
}
