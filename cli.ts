import { parseArgs } from "./src/cli/deps.ts";
import { initSubcommand } from "./src/cli/init.ts";
import { manifestSubcommand } from "./src/cli/manifest.ts";

const VERSION = "0.1.0";

const help = `fresh ${VERSION}
The next-gen web framework.

To initalize a new project:
  fresh init ./myproject

To (re-)generate the manifest file:
  fresh manifest

SUBCOMMANDS:
    init      Initalize a fresh project
    manifest  (Re-)generate the manifest file
`;

const args = parseArgs(Deno.args, {
  alias: {
    "help": "h",
    "version": "V",
    "watch": "w",
  },
  boolean: [
    "help",
    "version",
    "watch",
  ],
});

const subcommand = args._.shift();
switch (subcommand) {
  case "init":
    await initSubcommand(args);
    break;
  case "manifest":
    await manifestSubcommand(args);
    break;
  default:
    if (args.version) {
      console.log(`fresh ${VERSION}`);
      Deno.exit(0);
    }
    if (args.help) {
      console.log(help);
      Deno.exit(0);
    }
    console.error(help);
    Deno.exit(1);
}
