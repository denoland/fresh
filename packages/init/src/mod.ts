import { parseArgs } from "@std/cli/parse-args";
import { initProject } from "./init.ts";
import { InitError } from "./init.ts";

// deno-lint-ignore no-console
console.warn(
  "\x1b[33m%s\x1b[0m",
  `Warning: "deno run -Ar jsr:@fresh/init" is deprecated. Use "deno create @fresh/init" instead.`,
);

const flags = parseArgs(Deno.args, {
  boolean: ["force", "tailwind", "vscode", "docker", "help", "builder"],
  default: {
    force: null,
    tailwind: null,
    vscode: null,
    docker: null,
    builder: null,
  },
  alias: {
    help: "h",
  },
});

try {
  await initProject(Deno.cwd(), flags._, flags);
} catch (err) {
  if (err instanceof InitError) {
    Deno.exit(1);
  }
  throw err;
}
