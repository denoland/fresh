import { start } from "../../server.ts";
import routes from "./routes.gen.ts";

await start(routes);
