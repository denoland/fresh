#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { Builder } from "fresh/dev";
import { tailwind } from "@fresh/plugin-tailwind";

const builder = new Builder({ target: "safari12" });
tailwind(builder);

if (Deno.args.includes("build")) {
  await builder.build();
} else {
  await builder.listen(() => import("./main.ts"));
}
