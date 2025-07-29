import type { Adapter } from "./shared.ts";

export default function denoAdapter(): Adapter {
  return {
    name: "deno",
    async adapt(builder) {
      builder;
    },
  };
}
