import type { Plugin } from "../../src/server/types.ts";
import HackyRemoteComponent from "./components/HackyRemoteComponent.tsx";

export const hackyRemotePlugin = {
  name: "hackyRemotePlugin",
  routes: [
    {
      path: "remotePluginRoute",
      handler: (_req, ctx) => {
        return ctx.render();
      },
      component: HackyRemoteComponent,
    },
  ],
  location: import.meta.url,
} satisfies Plugin;
