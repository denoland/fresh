import { Builder } from "fresh/dev";
import { app } from "./main.ts";

const builder = new Builder({ target: "safari12" });

if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(app);
}
