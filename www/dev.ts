#!/usr/bin/env -S deno run -A --watch=static/,routes/

import { tailwind } from "@fresh/plugin-tailwind";
import { FreshDevApp } from "@fresh/core/dev";
import { app } from "./main.ts";

const devApp = new FreshDevApp();

await tailwind(devApp, {});

devApp.route("/", app);

if (Deno.args.includes("build")) {
  await devApp.build();
} else {
  await devApp.listen();
}
