import { Plugin } from "$fresh/server.ts";

export default function notCallingCtxRender(): Plugin {
  return {
    name: "not_calling_ctx_render",
    entrypoints: {},
    render() {
      return {};
    },
  };
}
