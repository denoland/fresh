import { Builder } from "../../../src/dev/mod.ts";
import { app } from "./main.tsx";

const builder = new Builder();

await builder.listen(app, {
  port: 4001,
});
