import { freshPlugin } from "../packages/plugin-dbundle/src/mod.ts";

export default {
  environments: {
    client: {
      entry: ["fresh:client-entry"],
      target: "browser",
      conditions: ["browser", "import", "default"],
      output: { dir: "_fresh/client" },
    },
    server: {
      entry: ["fresh:server-entry"],
      target: "server",
      runtime: "deno",
      conditions: ["deno", "import", "default"],
      output: { dir: "_fresh/server" },
      depends_on: ["client"],
    },
  },
  transform: {
    jsx: {
      runtime: "automatic",
      importSource: "preact",
    },
  },
  sourceMap: true,
  dev: { port: 8000 },
  plugins: [
    freshPlugin(),
  ],
};
