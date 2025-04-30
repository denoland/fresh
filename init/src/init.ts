import * as colors from "@std/fmt/colors";
import * as path from "@std/path";

// Keep these as is, as we replace these version in our release script
const FRESH_VERSION = "2.0.0-alpha.29";
const FRESH_TAILWIND_VERSION = "0.0.1-alpha.7";
const PREACT_VERSION = "10.25.4";
const PREACT_SIGNALS_VERSION = "2.0.1";

export const enum InitStep {
  ProjectName = "ProjectName",
  Force = "Force",
  Tailwind = "Tailwind",
  VSCode = "VSCode",
  Docker = "Docker",
}

function css(strs: TemplateStringsArray, ...exprs: string[]): string {
  let out = "";

  for (let i = 0; i < exprs.length; i++) {
    out += strs[i];
    out += String(exprs[i]);
  }
  out += strs.at(-1) ?? "";

  return out;
}

export class InitError extends Error {}

function error(tty: MockTTY, message: string): never {
  tty.logError(`%cerror%c: ${message}`, "color: red; font-weight: bold", "");
  throw new InitError();
}

export const HELP_TEXT = `@fresh/init

Initialize a new Fresh project. This will create all the necessary files for a
new project.

To generate a project in the './foobar' subdirectory:
  deno run -Ar jsr:@fresh/init ./foobar

To generate a project in the current directory:
  deno run -Ar jsr:@fresh/init .

USAGE:
    deno run -Ar jsr:@fresh/init [DIRECTORY]

OPTIONS:
    --force      Overwrite existing files
    --tailwind   Use Tailwind for styling
    --vscode     Setup project for VS Code
    --docker     Setup Project to use Docker
`;

export interface MockTTY {
  prompt(
    step: InitStep,
    message?: string | undefined,
    _default?: string | undefined,
  ): string | null;
  confirm(step: InitStep, message?: string | undefined): boolean;
  log(...args: unknown[]): void;
  logError(...args: unknown[]): void;
}

const realTTY: MockTTY = {
  prompt(_step, message, _default) {
    return prompt(message, _default);
  },
  confirm(_step, message) {
    return confirm(message);
  },
  log(...args) {
    // deno-lint-ignore no-console
    console.log(...args);
  },
  logError(...args) {
    // deno-lint-ignore no-console
    console.error(...args);
  },
};

export async function initProject(
  cwd = Deno.cwd(),
  input: (string | number)[],
  flags: {
    docker?: boolean | null;
    force?: boolean | null;
    tailwind?: boolean | null;
    vscode?: boolean | null;
  } = {},
  tty: MockTTY = realTTY,
): Promise<void> {
  tty.log();
  tty.log(
    colors.bgRgb8(
      colors.rgb8(" 🍋 Fresh: The next-gen web framework. ", 0),
      121,
    ),
  );
  tty.log();

  let unresolvedDirectory = Deno.args[0];
  if (input.length !== 1) {
    const userInput = tty.prompt(
      InitStep.ProjectName,
      "Project Name:",
      "fresh-project",
    );
    if (!userInput) {
      error(tty, HELP_TEXT);
    }

    unresolvedDirectory = userInput;
  }

  const CONFIRM_EMPTY_MESSAGE =
    "The target directory is not empty (files could get overwritten). Do you want to continue anyway?";

  const projectDir = path.resolve(cwd, unresolvedDirectory);

  try {
    const dir = [...Deno.readDirSync(projectDir)];
    const isEmpty = dir.length === 0 ||
      dir.length === 1 && dir[0].name === ".git";
    if (
      !isEmpty &&
      !(flags.force === null
        ? tty.confirm(InitStep.Force, CONFIRM_EMPTY_MESSAGE)
        : flags.force)
    ) {
      error(tty, "Directory is not empty.");
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  const useDocker = flags.docker;
  let useTailwind = flags.tailwind || false;
  if (flags.tailwind == null) {
    if (
      tty.confirm(
        InitStep.Tailwind,
        `Set up ${colors.cyan("Tailwind CSS")} for styling?`,
      )
    ) {
      useTailwind = true;
    }
  }

  const USE_VSCODE_MESSAGE = `Do you use ${colors.cyan("VS Code")}?`;
  const useVSCode = flags.vscode == null
    ? tty.confirm(InitStep.VSCode, USE_VSCODE_MESSAGE)
    : flags.vscode;

  const writeFile = async (
    pathname: string,
    content:
      | string
      | Uint8Array
      | ReadableStream<Uint8Array>
      | Record<string, unknown>,
  ) => await writeProjectFile(projectDir, pathname, content);

  const GITIGNORE = `# dotenv environment variable files
.env
.env.development.local
.env.test.local
.env.production.local
.env.local

# Fresh build directory
_fresh/
# npm + other dependencies
node_modules/
vendor/
`;

  await writeFile(".gitignore", GITIGNORE);

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
    await writeFile("Dockerfile", DOCKERFILE_TEXT);
  }

  const TAILWIND_CONFIG_TS = `import type { Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
} satisfies Config;`;
  if (useTailwind) {
    await writeFile("tailwind.config.ts", TAILWIND_CONFIG_TS);
  }

  // deno-fmt-ignore
  const GRADIENT_CSS = css`.fresh-gradient {
  background-color: rgb(134, 239, 172);
  background-image: linear-gradient(
    to right bottom,
    rgb(219, 234, 254),
    rgb(187, 247, 208),
    rgb(254, 249, 195)
  );
}`;

  const NO_TAILWIND_STYLES = css`*,
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
  font-family:
    ui-monospace,
    SFMono-Regular,
    Menlo,
    Monaco,
    Consolas,
    "Liberation Mono",
    "Courier New",
    monospace;
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
  font-family:
    ui-sans-serif,
    system-ui,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    Roboto,
    "Helvetica Neue",
    Arial,
    "Noto Sans",
    sans-serif,
    "Apple Color Emoji",
    "Segoe UI Emoji",
    "Segoe UI Symbol",
    "Noto Color Emoji";
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

${GRADIENT_CSS}`;

  const TAILWIND_CSS = css`@tailwind base;
@tailwind components;
@tailwind utilities;
${GRADIENT_CSS}`;

  const cssStyles = useTailwind ? TAILWIND_CSS : NO_TAILWIND_STYLES;
  await writeFile("static/styles.css", cssStyles);

  const STATIC_LOGO =
    `<svg width="40" height="40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M34.092 8.845C38.929 20.652 34.092 27 30 30.5c1 3.5-2.986 4.222-4.5 2.5-4.457 1.537-13.512 1.487-20-5C2 24.5 4.73 16.714 14 11.5c8-4.5 16-7 20.092-2.655Z" fill="#FFDB1E"/>
  <path d="M14 11.5c6.848-4.497 15.025-6.38 18.368-3.47C37.5 12.5 21.5 22.612 15.5 25c-6.5 2.587-3 8.5-6.5 8.5-3 0-2.5-4-5.183-7.75C2.232 23.535 6.16 16.648 14 11.5Z" fill="#fff" stroke="#FFDB1E"/>
  <path d="M28.535 8.772c4.645 1.25-.365 5.695-4.303 8.536-3.732 2.692-6.606 4.21-7.923 4.83-.366.173-1.617-2.252-1.617-1 0 .417-.7 2.238-.934 2.326-1.365.512-4.223 1.29-5.835 1.29-3.491 0-1.923-4.754 3.014-9.122.892-.789 1.478-.645 2.283-.645-.537-.773-.534-.917.403-1.546C17.79 10.64 23 8.77 25.212 8.42c.366.014.82.35.82.629.41-.14 2.095-.388 2.503-.278Z" fill="#FFE600"/>
  <path d="M14.297 16.49c.985-.747 1.644-1.01 2.099-2.526.566.121.841-.08 1.29-.701.324.466 1.657.608 2.453.701-.715.451-1.057.852-1.452 2.106-1.464-.611-3.167-.302-4.39.42Z" fill="#fff"/>
</svg>`;
  await writeFile("static/logo.svg", STATIC_LOGO);
  await writeFile(
    "static/favicon.ico",
    await Deno.readFile(
      new URL(import.meta.resolve("../../www/static/favicon.ico")),
    ),
  );

  const MAIN_TS = `import { App, fsRoutes, staticFiles } from "fresh";
import { define, type State } from "./utils.ts";

export const app = new App<State>();
app.use(staticFiles());

// this is the same as the /api/:name route defined via a file. feel free to delete this!
app.get("/api2/:name", (ctx) => {
  const name = ctx.params.name;
  return new Response(
    \`Hello, \${name.charAt(0).toUpperCase() + name.slice(1)}!\`,
  );
});

// this can also be defined via a file. feel free to delete this!
const exampleLoggerMiddleware = define.middleware((ctx) => {
  console.log(\`\${ctx.req.method} \${ctx.req.url}\`);
  return ctx.next();
});
app.use(exampleLoggerMiddleware);

await fsRoutes(app, {
  dir: "./",
  loadIsland: (path) => import(\`./islands/\${path}\`),
  loadRoute: (path) => import(\`./routes/\${path}\`),
});

if (import.meta.main) {
  await app.listen();
}`;
  await writeFile("main.ts", MAIN_TS);

  const COMPONENTS_BUTTON_TSX =
    `import type { ComponentChildren } from "preact";

export interface ButtonProps {
  onClick?: () => void;
  children?: ComponentChildren;
  disabled?: boolean;
}

export function Button(props: ButtonProps) {
  return (
    <button
      {...props}
      class="px-2 py-1 border-gray-500 border-2 rounded bg-white hover:bg-gray-200 transition-colors"
    />
  );
}`;
  await writeFile("components/Button.tsx", COMPONENTS_BUTTON_TSX);

  const UTILS_TS = `import { createDefine } from "fresh";

// deno-lint-ignore no-empty-interface
export interface State {}

export const define = createDefine<State>();`;
  await writeFile("utils.ts", UTILS_TS);

  const ROUTES_HOME = `import { useSignal } from "@preact/signals";
import { define } from "../utils.ts";
import Counter from "../islands/Counter.tsx";

export default define.page(function Home() {
  const count = useSignal(3);

  return (
    <div class="px-4 py-8 mx-auto fresh-gradient">
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
});`;
  await writeFile("routes/index.tsx", ROUTES_HOME);

  const APP_WRAPPER = `import type { PageProps } from "fresh";

export default function App({ Component }: PageProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${path.basename(projectDir)}</title>
        <link rel="stylesheet" href="/styles.css" />
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}`;
  await writeFile("routes/_app.tsx", APP_WRAPPER);

  const API_NAME = `import { define } from "../../utils.ts";

export const handler = define.handlers({
  GET(ctx) {
    const name = ctx.params.name;
    return new Response(
      \`Hello, \${name.charAt(0).toUpperCase() + name.slice(1)}!\`,
    );
  },
});`;
  await writeFile("routes/api/[name].tsx", API_NAME);

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
}`;
  await writeFile("islands/Counter.tsx", ISLANDS_COUNTER_TSX);

  const DEV_TS = `#!/usr/bin/env -S deno run -A --watch=static/,routes/
${useTailwind ? `import { tailwind } from "@fresh/plugin-tailwind";\n` : ""}
import { Builder } from "fresh/dev";
import { app } from "./main.ts";

const builder = new Builder();
${useTailwind ? "tailwind(builder, app, {});" : ""}
if (Deno.args.includes("build")) {
  await builder.build(app);
} else {
  await builder.listen(app);
}`;
  await writeFile("dev.ts", DEV_TS);

  const denoJson = {
    tasks: {
      check:
        // Revert once https://github.com/denoland/deno/issues/28923 is fixed
        "deno fmt --check . && deno lint . && deno check **/*.ts && deno check **/*.tsx",
      dev: "deno run -A --watch=static/,routes/ dev.ts",
      build: "deno run -A dev.ts build",
      start: "deno run -A main.ts",
      update: "deno run -A -r jsr:@fresh/update .",
    },
    lint: {
      rules: {
        tags: ["fresh", "recommended"],
      },
    },
    exclude: ["**/_fresh/*"],
    imports: {
      "fresh": `jsr:@fresh/core@^${FRESH_VERSION}`,
      "@fresh/plugin-tailwind":
        `jsr:@fresh/plugin-tailwind@^${FRESH_TAILWIND_VERSION}`,
      "preact": `npm:preact@^${PREACT_VERSION}`,
      "@preact/signals": `npm:@preact/signals@^${PREACT_SIGNALS_VERSION}`,
    } as Record<string, string>,
    compilerOptions: {
      lib: ["dom", "dom.asynciterable", "dom.iterable", "deno.ns"],
      jsx: "precompile",
      jsxImportSource: "preact",
      jsxPrecompileSkipElements: [
        "a",
        "img",
        "source",
        "body",
        "html",
        "head",
      ],
    },
  };

  if (useTailwind) {
    denoJson.imports["tailwindcss"] = "npm:tailwindcss@^3.4.3";
  }

  await writeFile("deno.json", denoJson);

  const README_MD = `# Fresh project

Your new Fresh project is ready to go. You can follow the Fresh "Getting
Started" guide here: https://fresh.deno.dev/docs/getting-started

### Usage

Make sure to install Deno: https://deno.land/manual/getting_started/installation

Then start the project in development mode:

\`\`\`
deno task dev
\`\`\`

This will watch the project directory and restart as necessary.`;
  await writeFile("README.md", README_MD);

  if (useVSCode) {
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

    await writeFile(".vscode/settings.json", vscodeSettings);

    const recommendations = ["denoland.vscode-deno"];
    if (useTailwind) recommendations.push("bradlc.vscode-tailwindcss");
    await writeFile(".vscode/extensions.json", { recommendations });

    if (useTailwind) {
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
                "url":
                  "https://tailwindcss.com/docs/functions-and-directives#apply",
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
                "url":
                  "https://tailwindcss.com/docs/functions-and-directives#screen",
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

      await writeFile(".vscode/tailwind.json", tailwindCustomData);
    }
  }

  // Specifically print unresolvedDirectory, rather than resolvedDirectory in order to
  // not leak personal info (e.g. `/Users/MyName`)
  tty.log("\n%cProject initialized!\n", "color: green; font-weight: bold");

  if (unresolvedDirectory !== ".") {
    tty.log(
      `Enter your project directory using %ccd ${unresolvedDirectory}%c.`,
      "color: cyan",
      "",
    );
  }
  tty.log(
    "Run %cdeno task start%c to start the project. %cCTRL-C%c to stop.",
    "color: cyan",
    "",
    "color: cyan",
    "",
  );
  tty.log();
  tty.log(
    "Stuck? Join our Discord %chttps://discord.gg/deno",
    "color: cyan",
    "",
  );
  tty.log();
  tty.log(
    "%cHappy hacking! 🦕",
    "color: gray",
  );
}

async function writeProjectFile(
  projectDir: string,
  pathname: string,
  content:
    | string
    | Uint8Array
    | ReadableStream<Uint8Array>
    | Record<string, unknown>,
) {
  const filePath = path.join(
    projectDir,
    ...pathname.split("/").filter(Boolean),
  );
  try {
    await Deno.mkdir(
      path.dirname(filePath),
      { recursive: true },
    );
    if (typeof content === "string") {
      let formatted = content;
      if (!content.endsWith("\n\n")) {
        formatted += "\n";
      }
      await Deno.writeTextFile(filePath, formatted);
    } else if (
      content instanceof Uint8Array || content instanceof ReadableStream
    ) {
      await Deno.writeFile(filePath, content);
    } else {
      await Deno.writeTextFile(
        filePath,
        JSON.stringify(content, null, 2) + "\n",
      );
    }
  } catch (err) {
    if (!(err instanceof Deno.errors.AlreadyExists)) {
      throw err;
    }
  }
}
