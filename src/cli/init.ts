import { join } from "./deps.ts";
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

  await Deno.mkdir(join(directory, "pages"), { recursive: true });
  const DEPS_TS = `export * from "${new URL(
    "../../runtime.ts",
    import.meta.url,
  )}";\n`;
  await Deno.writeTextFile(join(directory, "deps.ts"), DEPS_TS);
  const PAGES_INDEX_TSX = `import { h, IS_BROWSER, useState } from "../deps.ts";

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
  return <div>
    <p>{count}</p>
    <button onClick={() => setCount(count - 1)} disabled={!IS_BROWSER}>
      -1
    </button>
    <button onClick={() => setCount(count + 1)} disabled={!IS_BROWSER}>
      +1
    </button>
  </div>;
}
`;
  await Deno.writeTextFile(
    join(directory, "pages", "index.tsx"),
    PAGES_INDEX_TSX,
  );
  const PAGES_GREET_TSX = `import { h } from "../deps.ts";

interface Props {
  params: {
    name: string;
  };
}

export default function Greet(props: Props) {
  return <div>Hello {props.params.name}</div>;
}
`;
  await Deno.writeTextFile(
    join(directory, "pages", "[name].tsx"),
    PAGES_GREET_TSX,
  );
  const TSCONFIG_JSON = JSON.stringify(
    {
      "compilerOptions": {
        "jsxFactory": "h",
        "jsxFragmentFactory": "Fragment",
      },
    },
    undefined,
    2,
  );
  await Deno.writeTextFile(
    join(directory, "tsconfig.json"),
    TSCONFIG_JSON,
  );
  const README_MD = `# fresh project
  
### Usage

Install deployctl:

\`\`\`
deno install --allow-read --allow-write --allow-env --allow-net --allow-run --no-check -r -f https://deno.land/x/deploy/deployctl.ts
\`\`\`

Start the project:

\`\`\`
deployctl run --no-check --watch server.ts
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
