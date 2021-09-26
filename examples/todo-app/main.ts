/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "file:///Users/lucacasonato/projects/github.com/lucacasonato/fresh/server.ts";
import routes from "./routes.gen.ts";

await start(routes);
