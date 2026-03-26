import { Builder } from "../../../src/dev/mod.ts";

const builder = new Builder();

await builder.listen(() => import("./main.tsx"), {
  port: 4001,
});
