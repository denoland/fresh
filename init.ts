import { join, resolve } from "./src/dev/deps.ts";
import { error } from "./src/dev/error.ts";
import { collect, generate } from "./src/dev/mod.ts";

const help = `fresh-init

Initialize a new Fresh project. This will create all the necessary files for a
new project.

To generate a project in the './foobar' subdirectory:
  fresh-init ./foobar

To generate a project in the current directory:
  fresh-init .

USAGE:
    fresh-init <DIRECTORY>
`;

const CONFIRM_EMPTY_MESSAGE =
  "The target directory is not empty (files could get overwritten). Do you want to continue anyway?";

if (Deno.args.length !== 1) {
  error(help);
}

let directory = Deno.args[0];
directory = resolve(directory);

try {
  const dir = [...Deno.readDirSync(directory)];
  const isEmpty = dir.length === 0 ||
    dir.length === 1 && dir[0].name === ".git";
  if (!isEmpty && !confirm(CONFIRM_EMPTY_MESSAGE)) {
    error("Directory is not empty.");
  }
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}

await Deno.mkdir(join(directory, "routes", "api"), { recursive: true });
await Deno.mkdir(join(directory, "islands"), { recursive: true });
await Deno.mkdir(join(directory, "static"), { recursive: true });

const IMPORT_MAP_JSON = JSON.stringify(
  {
    "imports": {
      "$fresh/": new URL("./", import.meta.url).href,
      "preact": "https://esm.sh/preact@10.6.6",
      "preact/": "https://esm.sh/preact@10.6.6/",
      "preact-render-to-string":
        "https://esm.sh/preact-render-to-string@5.1.20?deps=preact@10.6.6",
    },
  },
  null,
  2,
);
await Deno.writeTextFile(join(directory, "import_map.json"), IMPORT_MAP_JSON);

const ROUTES_INDEX_TSX = `/** @jsx h */
import { h } from "preact";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <div>
      <img src="/logo.svg" height="100px" alt="the fresh logo: a sliced lemon dripping with juice" />
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
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";

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
import { h } from "preact";
import { PageProps } from "$fresh/runtime.ts";

export default function Greet(props: PageProps) {
  return <div>Hello {props.params.name}</div>;
}
`;
await Deno.writeTextFile(
  join(directory, "routes", "[name].tsx"),
  ROUTES_GREET_TSX,
);

const ROUTES_API_JOKE_TS = `import { HandlerContext } from "$fresh/server.ts";

// Jokes courtesy of https://punsandoneliners.com/randomness/programmer-jokes/
const JOKES = [
  "Why do Java developers often wear glasses? They can't C#.",
  "A SQL query walks into a bar, goes up to two tables and says “can I join you?”",
  "Wasn't hard to crack Forrest Gump's password. 1forrest1.",
  "I love pressing the F5 key. It's refreshing.",
  "Called IT support and a chap from Australia came to fix my network connection.  I asked “Do you come from a LAN down under?”",
  "There are 10 types of people in the world. Those who understand binary and those who don't.",
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

const STATIC_LOGO =
  `<svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M34.092 8.845C38.929 20.652 34.092 27 30 30.5c1 3.5-2.986 4.222-4.5 2.5-4.457 1.537-13.512 1.487-20-5C2 24.5 4.73 16.714 14 11.5c8-4.5 16-7 20.092-2.655Z" fill="#FFDB1E"/>
  <path d="M14 11.5c6.848-4.497 15.025-6.38 18.368-3.47C37.5 12.5 21.5 22.612 15.5 25c-6.5 2.587-3 8.5-6.5 8.5-3 0-2.5-4-5.183-7.75C2.232 23.535 6.16 16.648 14 11.5Z" fill="#fff" stroke="#FFDB1E"/>
  <path d="M28.535 8.772c4.645 1.25-.365 5.695-4.303 8.536-3.732 2.692-6.606 4.21-7.923 4.83-.366.173-1.617-2.252-1.617-1 0 .417-.7 2.238-.934 2.326-1.365.512-4.223 1.29-5.835 1.29-3.491 0-1.923-4.754 3.014-9.122.892-.789 1.478-.645 2.283-.645-.537-.773-.534-.917.403-1.546C17.79 10.64 23 8.77 25.212 8.42c.366.014.82.35.82.629.41-.14 2.095-.388 2.503-.278Z" fill="#FFE600"/>
  <path d="M14.297 16.49c.985-.747 1.644-1.01 2.099-2.526.566.121.841-.08 1.29-.701.324.466 1.657.608 2.453.701-.715.451-1.057.852-1.452 2.106-1.464-.611-3.167-.302-4.39.42Z" fill="#fff"/>
</svg>`;

await Deno.writeTextFile(
  join(directory, "static", "logo.svg"),
  STATIC_LOGO,
);

const MAIN_TS = `/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />
/// <reference lib="deno.unstable" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

await start(manifest);
`;
const MAIN_TS_PATH = join(directory, "main.ts");
await Deno.writeTextFile(MAIN_TS_PATH, MAIN_TS);

const DEV_TS = `#!/usr/bin/env -S deno run -A --watch=static/,routes/,islands/

import dev from "$fresh/dev.ts";

await dev(import.meta.url, "./main.ts");
`;
const DEV_TS_PATH = join(directory, "dev.ts");
await Deno.writeTextFile(DEV_TS_PATH, DEV_TS);
try {
  await Deno.chmod(DEV_TS_PATH, 0o777);
} catch {
  // this throws on windows
}

const DENO_CONFIG = JSON.stringify(
  {
    tasks: {
      start: "deno run -A --watch=static/,routes/,islands/ --no-check dev.ts",
    },
    importMap: "./import_map.json",
  },
  null,
  2,
);

await Deno.writeTextFile(join(directory, "deno.json"), DENO_CONFIG);

const README_MD = `# fresh project

### Usage

Start the project:

\`\`\`
deno task start
\`\`\`

This will watch the project directory and restart as necessary.
`;
await Deno.writeTextFile(
  join(directory, "README.md"),
  README_MD,
);

const manifest = await collect(directory);
await generate(directory, manifest);

console.log("\n%cProject created!", "color: green; font-weight: bold");
console.log("Run \`deno task start\` in the project directory to get started.");
