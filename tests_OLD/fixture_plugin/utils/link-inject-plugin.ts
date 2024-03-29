import type { Plugin } from "$fresh/server.ts";

export default {
  name: "link-inject",
  render(ctx) {
    ctx.render();
    return {
      links: [{ rel: "stylesheet", href: "styles.css" }, {
        rel: "stylesheet",
        href: "print.css",
        media: "print",
      }],
    };
  },
} as Plugin;
