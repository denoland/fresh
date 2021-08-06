import { join, resolve } from "./deps.ts";
import { error } from "./error.ts";
import { routes } from "./routes.ts";

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
    if (dir.length > 0) {
      error("Directory is not empty.");
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  await Deno.mkdir(join(directory, "pages", "api"), { recursive: true });
  const DEPS_TS = `export * from "${new URL(
    "../../runtime.ts",
    import.meta.url,
  )}";\n`;
  await Deno.writeTextFile(join(directory, "deps.ts"), DEPS_TS);
  const PAGES_INDEX_TSX = `/** @jsx h */
import { h, IS_BROWSER, useState } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to \`fresh\`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter />
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
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
    join(directory, "pages", "index.tsx"),
    PAGES_INDEX_TSX,
  );
  const PAGES_GREET_TSX = `/** @jsx h */
import { h } from "../deps.ts";

interface Props {
  params: Record<string, string | string[]>;
}

export default function Greet(props: Props) {
  return <div>Hello {props.params.name}</div>;
}
`;
  await Deno.writeTextFile(
    join(directory, "pages", "[name].tsx"),
    PAGES_GREET_TSX,
  );
  const PAGES_API_JOKE_TS =
    `// Jokes courtesy of https://punsandoneliners.com/randomness/programmer-jokes/
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

export const handler = (_req: Request): Response => {
  const randomIndex = Math.floor(Math.random() * 10);
  const body = JOKES[randomIndex];
  return new Response(body);
};
`;
  await Deno.writeTextFile(
    join(directory, "pages", "api", "joke.ts"),
    PAGES_API_JOKE_TS,
  );
  const serverUrl = new URL("../../server.ts", import.meta.url);
  const MAIN_TS = `/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "${serverUrl}";
import routes from "./routes.gen.ts";

await start(routes);
`;
  await Deno.writeTextFile(
    join(directory, "main.ts"),
    MAIN_TS,
  );
  const README_MD = `# fresh project

### Usage

Start the project:

\`\`\`
deno run -A --unstable --watch main.ts
\`\`\`

After adding, removing, or moving a page in the \`pages\` directory, run:

\`\`\`
fresh routes
\`\`\`
`;
  await Deno.writeTextFile(
    join(directory, "README.md"),
    README_MD,
  );

  await routes(directory);
}
