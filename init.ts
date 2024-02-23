import { basename, colors, join, parse, resolve } from "./src/dev/deps.ts";
import { error } from "./src/dev/error.ts";
import { collect, ensureMinDenoVersion, generate } from "./src/dev/mod.ts";
import {
  AOT_GH_ACTION,
  dotenvImports,
  freshImports,
  tailwindImports,
  twindImports,
} from "./src/dev/imports.ts";

ensureMinDenoVersion();

const help = `fresh-init

Initialize a new Fresh project. This will create all the necessary files for a
new project.

To generate a project in the './foobar' subdirectory:
  fresh-init ./foobar

To generate a project in the current directory:
  fresh-init .

USAGE:
    fresh-init [DIRECTORY]

OPTIONS:
    --force   Overwrite existing files
    --tailwind   Use Tailwind for styling
    --twind   Use Twind for styling
    --vscode  Setup project for VS Code
    --docker  Setup Project to use Docker
`;

const CONFIRM_EMPTY_MESSAGE =
  "The target directory is not empty (files could get overwritten). Do you want to continue anyway?";

const USE_VSCODE_MESSAGE = "Do you use VS Code?";

const flags = parse(Deno.args, {
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

if (flags.help) {
  console.log(help);
  Deno.exit(0);
}

if (flags.tailwind && flags.twind) {
  error("Cannot use Tailwind and Twind at the same time.");
}

console.log();
console.log(
  colors.bgRgb8(
    colors.rgb8(" 🍋 Fresh: The next-gen web framework. ", 0),
    121,
  ),
);
console.log();

let unresolvedDirectory = Deno.args[0];
if (flags._.length !== 1) {
  const userInput = prompt("Project Name:", "fresh-project");
  if (!userInput) {
    error(help);
  }

  unresolvedDirectory = userInput;
}

const resolvedDirectory = resolve(unresolvedDirectory);

try {
  const dir = [...Deno.readDirSync(resolvedDirectory)];
  const isEmpty = dir.length === 0 ||
    dir.length === 1 && dir[0].name === ".git";
  if (
    !isEmpty &&
    !(flags.force === null ? confirm(CONFIRM_EMPTY_MESSAGE) : flags.force)
  ) {
    error("Directory is not empty.");
  }
} catch (err) {
  if (!(err instanceof Deno.errors.NotFound)) {
    throw err;
  }
}
console.log("%cLet's set up your new Fresh project.\n", "font-weight: bold");

let useTailwind = flags.tailwind || false;
let useTwind = flags.twind || false;

if (flags.tailwind == null && flags.twind == null) {
  if (confirm("Do you want to use a styling library?")) {
    console.log();
    console.log(`1. ${colors.cyan("tailwindcss")} (recommended)`);
    console.log(`2. ${colors.cyan("Twind")}`);
    console.log();
    switch (
      (prompt("Which styling library do you want to use? [1]") || "1").trim()
    ) {
      case "2":
        useTwind = true;
        break;
      default:
        useTailwind = true;
    }
  }
}

const useVSCode = flags.vscode === null
  ? confirm(USE_VSCODE_MESSAGE)
  : flags.vscode;

const useDocker = flags.docker;

await Promise.all([
  Deno.mkdir(join(resolvedDirectory, "routes", "api"), { recursive: true }),
  Deno.mkdir(join(resolvedDirectory, "islands"), { recursive: true }),
  Deno.mkdir(join(resolvedDirectory, "static"), { recursive: true }),
  Deno.mkdir(join(resolvedDirectory, "components"), { recursive: true }),
]);
if (useVSCode) {
  await Deno.mkdir(join(resolvedDirectory, ".vscode"), { recursive: true });
}

const GITIGNORE = `# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# Fresh build directory
_fresh/
# npm dependencies
node_modules/
`;

await Deno.writeTextFile(
  join(resolvedDirectory, ".gitignore"),
  GITIGNORE,
);

if (useDocker) {
  const DENO_VERSION = Deno.version.deno;
  const DOCKERFILE_TEXT = `
FROM denoland/deno:${DENO_VERSION}

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=\${GIT_REVISION}

WORKDIR /app

COPY . .
RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "-A", "main.ts"]

`;

  await Deno.writeTextFile(
    join(resolvedDirectory, "Dockerfile"),
    DOCKERFILE_TEXT,
  );
}

const ROUTES_INDEX_TSX = `import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  const count = useSignal(3);
  return (
    <div class="px-4 py-8 mx-auto bg-[#86efac]">
      <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
        <img
          class="my-6"
          src="/logo.svg"
          width="128"
          height="128"
          alt="the Fresh logo: a sliced lemon dripping with juice"
        />
        <h1 class="text-4xl font-bold">Welcome to Fresh</h1>
        <p class="my-4">
          Try updating this message in the
          <code class="mx-2">./routes/index.tsx</code> file, and refresh.
        </p>
        <Counter count={count} />
      </div>
    </div>
  );
}
`;

const COMPONENTS_BUTTON_TSX = `import { JSX } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";

export function Button(props: JSX.HTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      disabled={!IS_BROWSER || props.disabled}
      class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors"
    />
  );
}
`;

const ISLANDS_COUNTER_TSX = `import type { Signal } from "@preact/signals";
import { Button } from "../components/Button.tsx";

interface CounterProps {
  count: Signal<number>;
}

export default function Counter(props: CounterProps) {
  return (
    <div class="flex gap-8 py-6">
      <Button onClick={() => props.count.value -= 1}>-1</Button>
      <p class="text-3xl tabular-nums">{props.count}</p>
      <Button onClick={() => props.count.value += 1}>+1</Button>
    </div>
  );
}
`;

// 404 page
const ROUTES_404_PAGE = `import { Head } from "$fresh/runtime.ts";

export default function Error404() {
  return (
    <>
      <Head>
        <title>404 - Page not found</title>
      </Head>
      <div class="px-4 py-8 mx-auto bg-[#86efac]">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo.svg"
            width="128"
            height="128"
            alt="the Fresh logo: a sliced lemon dripping with juice"
          />
          <h1 class="text-4xl font-bold">404 - Page not found</h1>
          <p class="my-4">
            The page you were looking for doesn't exist.
          </p>
          <a href="/" class="underline">Go back home</a>
        </div>
      </div>
    </>
  );
}
`;
await Promise.all([
  Deno.writeTextFile(
    join(resolvedDirectory, "routes", "index.tsx"),
    ROUTES_INDEX_TSX,
  ),
  Deno.writeTextFile(
    join(resolvedDirectory, "components", "Button.tsx"),
    COMPONENTS_BUTTON_TSX,
  ),
  Deno.writeTextFile(
    join(resolvedDirectory, "islands", "Counter.tsx"),
    ISLANDS_COUNTER_TSX,
  ),
  Deno.writeTextFile(
    join(resolvedDirectory, "routes", "_404.tsx"),
    ROUTES_404_PAGE,
  ),
]);

const ROUTES_GREET_TSX = `import { PageProps } from "$fresh/server.ts";

export default function Greet(props: PageProps) {
  return <div>Hello {props.params.name}</div>;
}
`;
await Deno.mkdir(join(resolvedDirectory, "routes", "greet"), {
  recursive: true,
});
await Deno.writeTextFile(
  join(resolvedDirectory, "routes", "greet", "[name].tsx"),
  ROUTES_GREET_TSX,
);

const ROUTES_API_JOKE_TS = `import { FreshContext } from "$fresh/server.ts";

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

export const handler = (_req: Request, _ctx: FreshContext): Response => {
  const randomIndex = Math.floor(Math.random() * JOKES.length);
  const body = JOKES[randomIndex];
  return new Response(body);
};
`;
await Deno.writeTextFile(
  join(resolvedDirectory, "routes", "api", "joke.ts"),
  ROUTES_API_JOKE_TS,
);

const TAILWIND_CONFIG_TS = `import { type Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
} satisfies Config;
`;
if (useTailwind) {
  await Deno.writeTextFile(
    join(resolvedDirectory, "tailwind.config.ts"),
    TAILWIND_CONFIG_TS,
  );
  const ghWorkflowDir = join(resolvedDirectory, ".github", "workflows");
  await Deno.mkdir(ghWorkflowDir, { recursive: true });
  await Deno.writeTextFile(
    join(ghWorkflowDir, "deploy.yml"),
    AOT_GH_ACTION,
  );
}

const TWIND_CONFIG_TS = `import { defineConfig, Preset } from "@twind/core";
import presetTailwind from "@twind/preset-tailwind";
import presetAutoprefix from "@twind/preset-autoprefix";

export default {
  ...defineConfig({
    presets: [presetTailwind() as Preset, presetAutoprefix() as Preset],
  }),
  selfURL: import.meta.url,
};
`;
if (useTwind) {
  await Deno.writeTextFile(
    join(resolvedDirectory, "twind.config.ts"),
    TWIND_CONFIG_TS,
  );
}

const NO_TAILWIND_STYLES = `
*,
*::before,
*::after {
  box-sizing: border-box;
}
* {
  margin: 0;
}
button {
  color: inherit;
}
button, [role="button"] {
  cursor: pointer;
}
code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: 1em;
}
img,
svg {
  display: block;
}
img,
video {
  max-width: 100%;
  height: auto;
}

html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif,
    "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
}
.transition-colors {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
.my-6 {
  margin-bottom: 1.5rem;
  margin-top: 1.5rem;
}
.text-4xl {
  font-size: 2.25rem;
  line-height: 2.5rem;
}
.mx-2 {
  margin-left: 0.5rem;
  margin-right: 0.5rem;
}
.my-4 {
  margin-bottom: 1rem;
  margin-top: 1rem;
}
.mx-auto {
  margin-left: auto;
  margin-right: auto;
}
.px-4 {
  padding-left: 1rem;
  padding-right: 1rem;
}
.py-8 {
  padding-bottom: 2rem;
  padding-top: 2rem;
}
.bg-\\[\\#86efac\\] {
  background-color: #86efac;
}
.text-3xl {
  font-size: 1.875rem;
  line-height: 2.25rem;
}
.py-6 {
  padding-bottom: 1.5rem;
  padding-top: 1.5rem;
}
.px-2 {
  padding-left: 0.5rem;
  padding-right: 0.5rem;
}
.py-1 {
  padding-bottom: 0.25rem;
  padding-top: 0.25rem;
}
.border-gray-500 {
  border-color: #6b7280;
}
.bg-white {
  background-color: #fff;
}
.flex {
  display: flex;
}
.gap-8 {
  grid-gap: 2rem;
  gap: 2rem;
}
.font-bold {
  font-weight: 700;
}
.max-w-screen-md {
  max-width: 768px;
}
.flex-col {
  flex-direction: column;
}
.items-center {
  align-items: center;
}
.justify-center {
  justify-content: center;
}
.border-2 {
  border-width: 2px;
}
.rounded {
  border-radius: 0.25rem;
}
.hover\\:bg-gray-200:hover {
  background-color: #e5e7eb;
}
.tabular-nums {
  font-variant-numeric: tabular-nums;
}
`;

const APP_WRAPPER = `import { type PageProps } from "$fresh/server.ts";
export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${basename(resolvedDirectory)}</title>
        ${useTwind ? "" : `<link rel="stylesheet" href="/styles.css" />`}
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}
`;

await Deno.writeTextFile(
  join(resolvedDirectory, "routes", "_app.tsx"),
  APP_WRAPPER,
);

const TAILWIND_CSS = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

const cssStyles = useTailwind ? TAILWIND_CSS : NO_TAILWIND_STYLES;
if (!useTwind) {
  await Deno.writeTextFile(
    join(resolvedDirectory, "static", "styles.css"),
    cssStyles,
  );
}

const STATIC_LOGO =
  `<svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M34.092 8.845C38.929 20.652 34.092 27 30 30.5c1 3.5-2.986 4.222-4.5 2.5-4.457 1.537-13.512 1.487-20-5C2 24.5 4.73 16.714 14 11.5c8-4.5 16-7 20.092-2.655Z" fill="#FFDB1E"/>
  <path d="M14 11.5c6.848-4.497 15.025-6.38 18.368-3.47C37.5 12.5 21.5 22.612 15.5 25c-6.5 2.587-3 8.5-6.5 8.5-3 0-2.5-4-5.183-7.75C2.232 23.535 6.16 16.648 14 11.5Z" fill="#fff" stroke="#FFDB1E"/>
  <path d="M28.535 8.772c4.645 1.25-.365 5.695-4.303 8.536-3.732 2.692-6.606 4.21-7.923 4.83-.366.173-1.617-2.252-1.617-1 0 .417-.7 2.238-.934 2.326-1.365.512-4.223 1.29-5.835 1.29-3.491 0-1.923-4.754 3.014-9.122.892-.789 1.478-.645 2.283-.645-.537-.773-.534-.917.403-1.546C17.79 10.64 23 8.77 25.212 8.42c.366.014.82.35.82.629.41-.14 2.095-.388 2.503-.278Z" fill="#FFE600"/>
  <path d="M14.297 16.49c.985-.747 1.644-1.01 2.099-2.526.566.121.841-.08 1.29-.701.324.466 1.657.608 2.453.701-.715.451-1.057.852-1.452 2.106-1.464-.611-3.167-.302-4.39.42Z" fill="#fff"/>
</svg>`;

await Deno.writeTextFile(
  join(resolvedDirectory, "static", "logo.svg"),
  STATIC_LOGO,
);

try {
  const faviconArrayBuffer = await fetch("https://fresh.deno.dev/favicon.ico")
    .then((d) => d.arrayBuffer());
  await Deno.writeFile(
    join(resolvedDirectory, "static", "favicon.ico"),
    new Uint8Array(faviconArrayBuffer),
  );
} catch {
  // Skip this and be silent if there is a network issue.
}

let FRESH_CONFIG_TS = `import { defineConfig } from "$fresh/server.ts";\n`;
if (useTailwind) {
  FRESH_CONFIG_TS += `import tailwind from "$fresh/plugins/tailwind.ts";
`;
}
if (useTwind) {
  FRESH_CONFIG_TS += `import twind from "$fresh/plugins/twindv1.ts";
import twindConfig from "./twind.config.ts";
`;
}

FRESH_CONFIG_TS += `
export default defineConfig({${
  useTailwind
    ? `\n  plugins: [tailwind()],\n`
    : useTwind
    ? `\n  plugins: [twind(twindConfig)],\n`
    : ""
}});
`;
const CONFIG_TS_PATH = join(resolvedDirectory, "fresh.config.ts");
await Deno.writeTextFile(CONFIG_TS_PATH, FRESH_CONFIG_TS);

let MAIN_TS = `/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import "$std/dotenv/load.ts";

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";
import config from "./fresh.config.ts";
`;

MAIN_TS += `
await start(manifest, config);\n`;
const MAIN_TS_PATH = join(resolvedDirectory, "main.ts");
await Deno.writeTextFile(MAIN_TS_PATH, MAIN_TS);

const DEV_TS = `#!/usr/bin/env -S deno run -A --watch=static/,routes/

import dev from "$fresh/dev.ts";
import config from "./fresh.config.ts";

import "$std/dotenv/load.ts";

await dev(import.meta.url, "./main.ts", config);
`;
const DEV_TS_PATH = join(resolvedDirectory, "dev.ts");
await Deno.writeTextFile(DEV_TS_PATH, DEV_TS);
try {
  await Deno.chmod(DEV_TS_PATH, 0o777);
} catch {
  // this throws on windows
}

const config = {
  lock: false,
  tasks: {
    check:
      "deno fmt --check && deno lint && deno check **/*.ts && deno check **/*.tsx",
    cli: "echo \"import '\\$fresh/src/dev/cli.ts'\" | deno run --unstable -A -",
    manifest: "deno task cli manifest $(pwd)",
    start: "deno run -A --watch=static/,routes/ dev.ts",
    build: "deno run -A dev.ts build",
    preview: "deno run -A main.ts",
    update: "deno run -A -r https://fresh.deno.dev/update .",
  },
  lint: {
    rules: {
      tags: ["fresh", "recommended"],
    },
  },
  exclude: ["**/_fresh/*"],
  imports: {} as Record<string, string>,
  compilerOptions: {
    jsx: "react-jsx",
    jsxImportSource: "preact",
  },
};
freshImports(config.imports);
if (useTailwind) {
  tailwindImports(config.imports);
  // Tailwind editor plugin expects the `node_modules` directory
  // to be present, otherwise intellisense doesn't work.
  // TODO: Have a better deno config type
  // deno-lint-ignore no-explicit-any
  (config as any).nodeModulesDir = true;
}
if (useTwind) {
  twindImports(config.imports);
}
dotenvImports(config.imports);

const DENO_CONFIG = JSON.stringify(config, null, 2) + "\n";

await Deno.writeTextFile(join(resolvedDirectory, "deno.json"), DENO_CONFIG);

const README_MD = `# Fresh project

Your new Fresh project is ready to go. You can follow the Fresh "Getting
Started" guide here: https://fresh.deno.dev/docs/getting-started

### Usage

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project:

\`\`\`
deno task start
\`\`\`

This will watch the project directory and restart as necessary.
`;
await Deno.writeTextFile(
  join(resolvedDirectory, "README.md"),
  README_MD,
);

const vscodeSettings = {
  "deno.enable": true,
  "deno.lint": true,
  "editor.defaultFormatter": "denoland.vscode-deno",
  "[typescriptreact]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
  },
  "[typescript]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
  },
  "[javascriptreact]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
  },
  "[javascript]": {
    "editor.defaultFormatter": "denoland.vscode-deno",
  },
  "css.customData": useTailwind ? [".vscode/tailwind.json"] : undefined,
};

const VSCODE_SETTINGS = JSON.stringify(vscodeSettings, null, 2) + "\n";

if (useVSCode) {
  await Deno.writeTextFile(
    join(resolvedDirectory, ".vscode", "settings.json"),
    VSCODE_SETTINGS,
  );
}

const vscodeExtensions = {
  recommendations: ["denoland.vscode-deno"],
};

if (useTailwind) {
  vscodeExtensions.recommendations.push("bradlc.vscode-tailwindcss");
}

const VSCODE_EXTENSIONS = JSON.stringify(vscodeExtensions, null, 2) + "\n";

if (useVSCode) {
  await Deno.writeTextFile(
    join(resolvedDirectory, ".vscode", "extensions.json"),
    VSCODE_EXTENSIONS,
  );
}

const tailwindCustomData = {
  "version": 1.1,
  "atDirectives": [
    {
      "name": "@tailwind",
      "description":
        "Use the `@tailwind` directive to insert Tailwind's `base`, `components`, `utilities` and `screens` styles into your CSS.",
      "references": [
        {
          "name": "Tailwind Documentation",
          "url":
            "https://tailwindcss.com/docs/functions-and-directives#tailwind",
        },
      ],
    },
    {
      "name": "@apply",
      "description":
        "Use the `@apply` directive to inline any existing utility classes into your own custom CSS. This is useful when you find a common utility pattern in your HTML that you’d like to extract to a new component.",
      "references": [
        {
          "name": "Tailwind Documentation",
          "url": "https://tailwindcss.com/docs/functions-and-directives#apply",
        },
      ],
    },
    {
      "name": "@responsive",
      "description":
        "You can generate responsive variants of your own classes by wrapping their definitions in the `@responsive` directive:\n```css\n@responsive {\n  .alert {\n    background-color: #E53E3E;\n  }\n}\n```\n",
      "references": [
        {
          "name": "Tailwind Documentation",
          "url":
            "https://tailwindcss.com/docs/functions-and-directives#responsive",
        },
      ],
    },
    {
      "name": "@screen",
      "description":
        "The `@screen` directive allows you to create media queries that reference your breakpoints by **name** instead of duplicating their values in your own CSS:\n```css\n@screen sm {\n  /* ... */\n}\n```\n…gets transformed into this:\n```css\n@media (min-width: 640px) {\n  /* ... */\n}\n```\n",
      "references": [
        {
          "name": "Tailwind Documentation",
          "url": "https://tailwindcss.com/docs/functions-and-directives#screen",
        },
      ],
    },
    {
      "name": "@variants",
      "description":
        "Generate `hover`, `focus`, `active` and other **variants** of your own utilities by wrapping their definitions in the `@variants` directive:\n```css\n@variants hover, focus {\n   .btn-brand {\n    background-color: #3182CE;\n  }\n}\n```\n",
      "references": [
        {
          "name": "Tailwind Documentation",
          "url":
            "https://tailwindcss.com/docs/functions-and-directives#variants",
        },
      ],
    },
  ],
};
const TAILWIND_CUSTOMDATA = JSON.stringify(tailwindCustomData, null, 2) + "\n";

if (useVSCode && useTailwind) {
  await Deno.writeTextFile(
    join(resolvedDirectory, ".vscode", "tailwind.json"),
    TAILWIND_CUSTOMDATA,
  );
}

const manifest = await collect(resolvedDirectory);
await generate(resolvedDirectory, manifest);

// Specifically print unresolvedDirectory, rather than resolvedDirectory in order to
// not leak personal info (e.g. `/Users/MyName`)
console.log("\n%cProject initialized!\n", "color: green; font-weight: bold");

if (unresolvedDirectory !== ".") {
  console.log(
    `Enter your project directory using %ccd ${unresolvedDirectory}%c.`,
    "color: cyan",
    "",
  );
}
console.log(
  "Run %cdeno task start%c to start the project. %cCTRL-C%c to stop.",
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
console.log(
  "%cHappy hacking! 🦕",
  "color: gray",
);
