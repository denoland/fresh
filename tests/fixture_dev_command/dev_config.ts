import { dev } from "$fresh/src/dev/dev_command.ts";
import config from "./fresh.config.ts";

Deno.env.set("FRESH_DEV_COMMAND_MODE", "config");
await dev(import.meta.url, "./main.ts", config);
