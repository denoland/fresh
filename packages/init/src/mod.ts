#!/usr/bin/env -S deno run -A
/**
 * CLI entry point for @fresh/init-templates
 *
 * This module provides the same interface as the old @fresh/init package,
 * accepting the same function signature: initProject(cwd, input[], flags)
 *
 * When run directly (deno run -Ar jsr:@fresh/init-templates), this serves as
 * the command-line interface.
 */

import { parseArgs } from "@std/cli/parse-args";
import * as colors from "@std/fmt/colors";
import { initProject as initProjectImpl, resolveVersions } from "./init.ts";
import type { InitOptions } from "./types.ts";
import initConfig from "../deno.json" with { type: "json" };

const HELP_TEXT = `
${
  colors.bgRgb8(
    colors.rgb8(
      ` 🍋 @fresh/init${colors.rgb8(`@${initConfig.version}`, 248)} `,
      0,
    ),
    121,
  )
}

Initialize a new Fresh project. This will create all the necessary files
for a new project.

To generate a project in the './foobar' subdirectory:
    ${colors.rgb8("deno run -Ar jsr:@fresh/init ./foobar", 245)}

To generate a project in the current directory:
    ${colors.rgb8("deno run -Ar jsr:@fresh/init .", 245)}

${colors.rgb8("USAGE:", 3)}
    ${colors.rgb8("deno run -Ar jsr:@fresh/init [DIRECTORY]", 245)}

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

export class InitError extends Error {}

function error(message: string): never {
  console.error(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
  throw new InitError();
}

/**
 * Initialize a Fresh project.
 *
 * This function provides backward compatibility with the old @fresh/init
 * package by accepting the same signature: (cwd, input[], flags).
 *
 * @param cwd - Current working directory
 * @param input - Directory arguments from command line
 * @param flags - CLI flags (force, tailwind, vscode, docker, builder, help)
 */
export async function initProject(
  cwd: string = Deno.cwd(),
  input: (string | number)[],
  flags: {
    docker?: boolean | null;
    force?: boolean | null;
    tailwind?: boolean | null;
    vscode?: boolean | null;
    builder?: boolean | null;
    help?: boolean | null;
    h?: boolean | null;
  } = {},
): Promise<void> {
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
  console.log();

  // Get project directory
  let directory: string;
  if (input.length === 0) {
    const userInput = prompt("Project Name:", "fresh-project");
    if (!userInput) {
      error(HELP_TEXT);
    }
    directory = userInput;
  } else if (input.length === 1) {
    directory = String(input[0]);
  } else {
    error("Too many arguments. Expected at most one directory argument.");
  }

  // Build options from CLI flags (with prompts for missing values)
  const tailwind = flags.tailwind ?? confirm(CONFIRM_TAILWIND_MESSAGE);
  const vscode = flags.vscode ?? confirm(CONFIRM_VSCODE_MESSAGE);
  let force = flags.force ?? false;

  // Check if directory is empty (if not forced)
  if (!force) {
    try {
      const projectDir = new URL(directory, `file://${cwd}/`).pathname;
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
  const options: Required<InitOptions> = {
    directory,
    builder: flags.builder ?? false,
    tailwind,
    vscode,
    docker: flags.docker ?? false,
    force,
  };

  // Resolve versions
  const versions = await resolveVersions();

  console.log(`    version ${colors.rgb8(versions.FRESH_VERSION, 4)}`);
  console.log();

  // Call the template engine (pure processing, no output)
  await initProjectImpl(cwd, options, versions);

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

// When run as CLI
if (import.meta.main) {
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
}
