import { start } from "./server_deps.ts";
import routes from "./fresh.gen.ts";

await start(routes);
