import { parseArgs } from "@std/cli/parse-args";
import { initProject } from "./init.ts";
import { InitError } from "./init.ts";

const flags = parseArgs(Deno.args, {
  boolean: ["force", "tailwind", "twind", "vscode", "docker", "help"],
  default: {
    force: null,
    tailwind: null,
    twind: null,
    vscode: null,
    docker: null,
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
