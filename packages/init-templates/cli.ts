#!/usr/bin/env -S deno run -A
// deno-lint-ignore-file no-console
/**
 * Command-line interface for @fresh/init-templates
 *
 * This provides a CLI wrapper around the initProject function,
 * maintaining compatibility with the old @fresh/init package.
 */

import { parseArgs } from "@std/cli/parse-args";
import * as colors from "@std/fmt/colors";
import { initProject, resolveVersions } from "./src/init.ts";
import { InitError } from "./src/errors.ts";
import type { InitOptions, ResolvedInitOptions } from "./src/types.ts";
import initConfig from "./deno.json" with { type: "json" };

const HELP_TEXT = `
${
  colors.bgRgb8(
    colors.rgb8(
      ` 🍋 @fresh/init-templates${colors.rgb8(`@${initConfig.version}`, 248)} `,
      0,
    ),
    121,
  )
}

Initialize a new Fresh project. This will create all the necessary files
for a new project.

To generate a project in the './foobar' subdirectory:
    ${colors.rgb8("deno run -Ar jsr:@fresh/init-templates ./foobar", 245)}

To generate a project in the current directory:
    ${colors.rgb8("deno run -Ar jsr:@fresh/init-templates .", 245)}

${colors.rgb8("USAGE:", 3)}
    ${colors.rgb8("deno run -Ar jsr:@fresh/init-templates [DIRECTORY]", 245)}

${colors.rgb8("OPTIONS:", 3)}
    ${colors.rgb8("--force", 2)}      Overwrite existing files
    ${colors.rgb8("--tailwind", 2)}   Use Tailwind for styling
    ${colors.rgb8("--vscode", 2)}     Setup project for VS Code
    ${colors.rgb8("--docker", 2)}     Setup project to use Docker
    ${colors.rgb8("--builder", 2)}    Setup with builder instead of vite
    ${colors.rgb8("--help, -h", 2)}   Show this help message
`;

const CONFIRM_EMPTY_MESSAGE =
  "The target directory is not empty (files could get overwritten). Do you want to continue anyway?";
const CONFIRM_TAILWIND_MESSAGE = `Set up ${
  colors.cyan("Tailwind CSS")
} for styling?`;
const CONFIRM_VSCODE_MESSAGE = `Do you use ${colors.cyan("VS Code")}?`;

function error(message: string): never {
  console.error(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
  throw new InitError(message);
}

async function main() {
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

  // Show help if requested
  if (flags.help || flags.h) {
    console.log(HELP_TEXT);
    return;
  }

  // Display banner
  console.log();
  console.log(
    colors.bgRgb8(
      colors.rgb8(" 🍋 Fresh: The next-gen web framework. ", 0),
      121,
    ),
  );
  console.log(`    version ${colors.rgb8(initConfig.version, 4)}`);
  console.log();

  // Get project directory
  let directory: string;
  if (flags._.length === 0) {
    const userInput = prompt("Project Name:", "fresh-project");
    if (!userInput) {
      error(HELP_TEXT);
    }
    directory = userInput;
  } else if (flags._.length === 1) {
    directory = String(flags._[0]);
  } else {
    error("Too many arguments. Expected at most one directory argument.");
  }

  // Build partial options from CLI flags
  const partialOptions: InitOptions = {
    directory,
    force: flags.force ?? undefined,
    builder: flags.builder ?? false,
    docker: flags.docker ?? false,
    tailwind: flags.tailwind ?? undefined,
    vscode: flags.vscode ?? undefined,
  };

  // Interactive prompts for missing options
  const tailwind = partialOptions.tailwind ?? confirm(CONFIRM_TAILWIND_MESSAGE);
  const vscode = partialOptions.vscode ?? confirm(CONFIRM_VSCODE_MESSAGE);
  let force = partialOptions.force ?? false;

  // Check if directory is empty (if not forced)
  if (!force) {
    try {
      const projectDir = new URL(directory, `file://${Deno.cwd()}/`).pathname;
      const entries = [...Deno.readDirSync(projectDir)];
      const isEmpty = entries.length === 0 ||
        (entries.length === 1 && entries[0].name === ".git");

      if (!isEmpty) {
        const shouldContinue = confirm(CONFIRM_EMPTY_MESSAGE);
        if (!shouldContinue) {
          error("Directory is not empty. Use --force to overwrite.");
        }
        force = true;
      }
    } catch (err) {
      if (!(err instanceof Deno.errors.NotFound)) {
        throw err;
      }
      // Directory doesn't exist - that's fine
    }
  }

  // Build fully resolved options
  const resolvedOptions: ResolvedInitOptions = {
    directory,
    builder: partialOptions.builder ?? false,
    tailwind,
    vscode,
    docker: partialOptions.docker ?? false,
    force,
  };

  // Resolve versions
  const versions = await resolveVersions(partialOptions.versions);

  console.log(`    version ${colors.rgb8(versions.FRESH_VERSION, 4)}`);
  console.log();

  // Call the template engine (pure processing, no output)
  try {
    await initProject(Deno.cwd(), resolvedOptions, versions);
  } catch (err) {
    if (err instanceof InitError) {
      Deno.exit(1);
    }
    throw err;
  }

  // Display success messages
  console.log(
    "\n%cProject initialized!\n",
    "color: green; font-weight: bold",
  );

  if (directory !== ".") {
    console.log(
      `Enter your project directory using %ccd ${directory}%c.`,
      "color: cyan",
      "",
    );
  }
  console.log(
    "Run %cdeno task dev%c to start the project. %cCTRL-C%c to stop.",
    "color: cyan",
    "",
    "color: cyan",
    "",
  );
  console.log();
  console.log(
    "Stuck? Join our Discord %chttps://discord.gg/deno",
    "color: cyan",
    "",
  );
  console.log();
  console.log("%cHappy hacking! 🦕", "color: gray");
}

// Run the CLI
if (import.meta.main) {
  main();
}
