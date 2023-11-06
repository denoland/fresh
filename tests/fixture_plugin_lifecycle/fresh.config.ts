import { defineConfig } from "$fresh/src/server/defines.ts";
import { relative } from "../deps.ts";

export default defineConfig({
  plugins: [
    {
      name: "a",
      buildEnd() {
        console.log("Plugin a: buildEnd");
      },
      buildStart() {
        console.log("Plugin a: buildStart");
      },
    },
    {
      name: "b",
      buildEnd() {
        console.log("Plugin b: buildEnd");
      },
      buildStart() {
        console.log("Plugin b: buildStart");
      },
    },
    {
      name: "c",
      buildStart(config) {
        const outDir = relative(Deno.cwd(), config.build.outDir);
        console.log(`Plugin c: ${outDir}`);
      },
    },
  ],
});
