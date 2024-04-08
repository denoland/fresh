import { join, toFileUrl } from "./deps.ts";
import { manifest } from "./mod.ts";
import { type FreshConfig } from "../server/mod.ts";

const args = Deno.args;

switch (args[0]) {
  case "manifest": {
    if (args[1]) {
      const CONFIG_TS_PATH = join(args[1], "fresh.config.ts");
      const url = toFileUrl(CONFIG_TS_PATH).toString();
      const config: FreshConfig = (await import(url)).default;
      await manifest(args[1], config?.router?.ignoreFilePattern);
    } else {
      console.error("Missing input for manifest command");
      Deno.exit(1);
    }
    break;
  }
  default: {
    console.error("Invalid command");
    Deno.exit(1);
  }
}
