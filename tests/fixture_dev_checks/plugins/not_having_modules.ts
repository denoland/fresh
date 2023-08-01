import { Plugin } from "$fresh/server.ts";

export default function notHavingModules(): Plugin {
  return {
    name: "not_having_modules",
    entrypoints: { "main": "() => {}" },
    render(ctx) {
      ctx.render();

      return {
        scripts: [{ entrypoint: "main", state: [] }],
      };
    },
  };
}
