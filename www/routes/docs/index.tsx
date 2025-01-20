import { define } from "../../utils/state.ts";

export const handler = define.handlers({
  GET(_ctx) {
    return new Response("", {
      status: 307,
      headers: { location: "/docs/introduction" },
    });
  },
});
