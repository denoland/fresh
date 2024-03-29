import { dev } from "$fresh/src/dev/dev_command.ts";

await dev(import.meta.url, "./main.ts");
