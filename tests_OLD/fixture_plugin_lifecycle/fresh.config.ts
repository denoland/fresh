import { defineConfig } from "../../src/__OLD/server/defines.ts";
import { relative } from "../deps.ts";

export default defineConfig({
  plugins: [
    {
      name: "a",
      configResolved() {
        console.log("Plugin a: configResolved");
      },
      buildEnd() {
        console.log("Plugin a: buildEnd");
      },
      buildStart() {
        console.log("Plugin a: buildStart");
      },
    },
    {
      name: "b",
      configResolved() {
        console.log("Plugin b: configResolved");
      },
      buildEnd() {
        console.log("Plugin b: buildEnd");
      },
      buildStart() {
        console.log("Plugin b: buildStart");
      },
    },
    {
      name: "c",
      configResolved() {
        console.log("Plugin c: configResolved");
      },
      buildStart(config) {
        const outDir = relative(Deno.cwd(), config.build.outDir);
        console.log(`Plugin c: ${outDir}`);
      },
    },
  ],
});
