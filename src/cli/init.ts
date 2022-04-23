import { join, resolve } from "./deps.ts";
import { error } from "./error.ts";
import { manifest } from "./manifest.ts";

const help = `fresh init

Initialize a new \`fresh\` project. This will create all the necessary files for
a new project.

To generate a project in the './foobar' subdirectory:
  fresh init ./foobar

To generate a project in the current directory:
  fresh init .

USAGE:
    fresh init [OPTIONS] <DIRECTORY>

OPTIONS:
    -h, --help                 Prints help information
`;

export interface Args {
  help: boolean;
}

// deno-lint-ignore no-explicit-any
export async function initSubcommand(rawArgs: Record<string, any>) {
  const args: Args = {
    help: !!rawArgs.help,
  };
  const directory: string | null = typeof rawArgs._[0] === "string"
    ? rawArgs._[0]
    : null;
  if (args.help) {
    console.log(help);
    Deno.exit(0);
  }
  if (directory === null) {
    console.error(help);
    error("No directory given.");
  }
  await init(directory);
}

async function init(directory: string) {
  directory = resolve(directory);

  try {
    const dir = [...Deno.readDirSync(directory)];
    if (
      dir.length > 0 &&
      !confirm(
        "This is no Empty directory, some Files could get deleted, do you want to continue?",
      )
    ) {
      error("Directory is not empty.");
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  await Deno.mkdir(join(directory, "routes", "api"), { recursive: true });
  await Deno.mkdir(join(directory, "islands"), { recursive: true });

  const CLIENT_DEPS_TS = `export * from "${new URL(
    "../../runtime.ts",
    import.meta.url,
  )}";\n`;
  await Deno.writeTextFile(join(directory, "client_deps.ts"), CLIENT_DEPS_TS);
  const SERVER_DEPS_TS = `export * from "${new URL(
    "../../server.ts",
    import.meta.url,
  )}";\n`;
  await Deno.writeTextFile(join(directory, "server_deps.ts"), SERVER_DEPS_TS);

  const ROUTES_INDEX_TSX = `/** @jsx h */
import { h } from "../client_deps.ts";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to \`fresh\`. Try update this message in the ./routes/index.tsx
        file, and refresh.
      </p>
      <Counter start={3} />
    </div>
  );
}
`;
  await Deno.writeTextFile(
    join(directory, "routes", "index.tsx"),
    ROUTES_INDEX_TSX,
  );

  const ISLANDS_COUNTER_TSX = `/** @jsx h */
import { h, IS_BROWSER, useState } from "../client_deps.ts";

interface CounterProps {
  start: number;
}

export default function Counter(props: CounterProps) {
  const [count, setCount] = useState(props.start);
  return (
    <div>
      <p>{count}</p>
      <button onClick={() => setCount(count - 1)} disabled={!IS_BROWSER}>
        -1
      </button>
      <button onClick={() => setCount(count + 1)} disabled={!IS_BROWSER}>
        +1
      </button>
    </div>
  );
}
`;
  await Deno.writeTextFile(
    join(directory, "islands", "Counter.tsx"),
    ISLANDS_COUNTER_TSX,
  );

  const ROUTES_GREET_TSX = `/** @jsx h */
import { h, PageProps } from "../client_deps.ts";

export default function Greet(props: PageProps) {
  return <div>Hello {props.params.name}</div>;
}
`;
  await Deno.writeTextFile(
    join(directory, "routes", "[name].tsx"),
    ROUTES_GREET_TSX,
  );

  const ROUTES_API_JOKE_TS =
    `import { HandlerContext } from "../../server_deps.ts";

// Jokes courtesy of https://punsandoneliners.com/randomness/programmer-jokes/
const JOKES = [
  "Why do Java developers often wear glasses? They can’t C#.",
  "A SQL query walks into a bar, goes up to two tables and says “can I join you?",
  "Wasn’t hard to crack Forrest Gump’s password. 1forrest1.",
  "I love pressing the F5 key. It’s refreshing.",
  "Called IT support and a chap from Australia came to fix my network connection.  I asked “Do you come from a LAN down under?”",
  "There are 10 types of people in the world. Those who understand binary and those who don’t.",
  "Why are assembly programmers often wet? They work below C level.",
  "My favourite computer based band is the Black IPs.",
  "What programme do you use to predict the music tastes of former US presidential candidates? An Al Gore Rhythm.",
  "An SEO expert walked into a bar, pub, inn, tavern, hostelry, public house.",
];

export const handler = (_req: Request, _ctx: HandlerContext): Response => {
  const randomIndex = Math.floor(Math.random() * 10);
  const body = JOKES[randomIndex];
  return new Response(body);
};
`;
  await Deno.writeTextFile(
    join(directory, "routes", "api", "joke.ts"),
    ROUTES_API_JOKE_TS,
  );

  const MAIN_TS =
    `#!/usr/bin/env -S deno run --allow-read --allow-net --allow-env --allow-run --allow-hrtime --no-check --watch

/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "./server_deps.ts";
import manifest from "./fresh.gen.ts";

await start(manifest);
`;
  const MAIN_TS_PATH = join(directory, "main.ts");
  await Deno.writeTextFile(MAIN_TS_PATH, MAIN_TS);
  try {
    await Deno.chmod(MAIN_TS_PATH, 0o777);
  } catch {
    // this throws on windows
  }

  const DENO_CONFIG = `{
  "tasks": {
    "start": "deno run -A --watch main.ts"
  }
}`;

  await Deno.writeTextFile(join(directory, "deno.json"), DENO_CONFIG);

  const README_MD = `# fresh project

### Usage

Start the project:

\`\`\`
deno task start
\`\`\`

After adding, removing, or moving a page in the \`routes\` or directory, or adding,
removing, or moving an island in the \`islands\` directory, run:

\`\`\`
fresh manifest
\`\`\`
`;
  await Deno.writeTextFile(
    join(directory, "README.md"),
    README_MD,
  );

  await manifest(directory);
}
