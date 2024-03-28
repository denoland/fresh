import { defineApp } from "$fresh/server.ts";
import type { State } from "../other/state.ts";

export default defineApp<State>((req, ctx) => {
  ctx.state.something = "foo";
  return (
    <div class="app">
      <ctx.Component />
    </div>
  );
});
