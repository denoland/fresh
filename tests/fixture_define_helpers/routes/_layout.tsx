import { defineLayout } from "$fresh/server.ts";
import { State } from "../other/state.ts";

export default defineLayout<State>((req, ctx) => {
  return (
    <div class="layout">
      <p>
        Layout: {ctx.state.something === "foo" ? "it works" : "it doesn't work"}
      </p>
      <ctx.Component />
    </div>
  );
});
