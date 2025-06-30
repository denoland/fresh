#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { Builder } from "fresh/dev";
import { app } from "./main.ts";
import { tailwind } from "@fresh/plugin-tailwind";

const builder = new Builder({ target: "safari12" });
tailwind(builder, app);

if (Deno.args.includes("build")) {
  builder.build(app);
} else {
  builder.listen(app);
}
