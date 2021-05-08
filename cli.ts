import { parseArgs } from "./src/cli/deps.ts";
import { initSubcommand } from "./src/cli/init.ts";
import { routesSubcommand } from "./src/cli/routes.ts";

const VERSION = "0.1.0";

const help = `fresh ${VERSION}
Preact, but super edgy.

To initalize a new project:
  fresh init ./myproject

To (re-)generate route manifest:
  fresh routes

SUBCOMMANDS:
    init      Initalize a fresh project
    routes    (Re-)generate the route manifest file
`;

const args = parseArgs(Deno.args, {
  alias: {
    "help": "h",
    "version": "V",
  },
  boolean: [
    "help",
    "version",
  ],
});

const subcommand = args._.shift();
switch (subcommand) {
  case "init":
    await initSubcommand(args);
    break;
  case "routes":
    await routesSubcommand(args);
    break;
  default:
    if (args.version) {
      console.log(`deployctl ${VERSION}`);
      Deno.exit(0);
    }
    if (args.help) {
      console.log(help);
      Deno.exit(0);
    }
    console.error(help);
    Deno.exit(1);
}
