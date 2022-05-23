import { start } from "$fresh/server.ts";
import routes from "./fresh.gen.ts";

await start(routes);
