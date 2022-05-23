import { start } from "./deps.server.ts";
import routes from "./fresh.gen.ts";

await start(routes);
