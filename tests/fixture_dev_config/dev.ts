import { dev } from "$fresh/src/dev/dev_command.ts";
import config from "./fresh.config.ts";

await dev(import.meta.url, "./main.ts", config);
