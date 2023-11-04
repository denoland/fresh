import {
  basename,
  dirname,
  existsSync,
  extname,
  join,
  JSONC,
  Node,
  parse,
  Project,
  resolve,
  walk,
} from "./src/dev/deps.ts";
import { error } from "./src/dev/error.ts";
import { freshImports, twindImports } from "./src/dev/imports.ts";
import { collect, ensureMinDenoVersion, generate } from "./src/dev/mod.ts";

ensureMinDenoVersion();

const help = `fresh-update

Update a Fresh project. This updates dependencies and optionally performs code
mods to update a project's source code to the latest recommended patterns.

To upgrade a project in the current directory, run:
  fresh-update .

USAGE:
    fresh-update [DIRECTORY]
`;

const flags = parse(Deno.args, {});

let unresolvedDirectory = Deno.args[0];
if (flags._.length !== 1) {
  const userInput = prompt("Project Directory", ".");
  if (!userInput) {
    error(help);
  }

  unresolvedDirectory = userInput;
}

const resolvedDirectory = resolve(unresolvedDirectory);
const srcDirectory = await findSrcDirectory("main.ts", resolvedDirectory);

// Update dependencies in the import map. The import map can either be embedded
// in a deno.json (or .jsonc) file or be in a separate JSON file referenced with the
// `importMap` key in deno.json.
const fileNames = ["deno.json", "deno.jsonc"];
const DENO_JSON_PATH = fileNames
  .map((fileName) => join(resolvedDirectory, fileName))
  .find((path) => existsSync(path));
if (!DENO_JSON_PATH) {
  throw new Error(
    `Neither deno.json nor deno.jsonc could be found in ${resolvedDirectory}`,
  );
}
const denoJsonText = await Deno.readTextFile(DENO_JSON_PATH);
const ext = extname(DENO_JSON_PATH);
let denoJson;
if (ext === ".json") {
  denoJson = JSON.parse(denoJsonText);
} else if (ext === ".jsonc") {
  denoJson = JSONC.parse(denoJsonText);
} else {
  throw new Error(`Unsupported file extension: ${ext}`);
}
if (denoJson.importMap) {
  const IMPORT_MAP_PATH = join(resolvedDirectory, denoJson.importMap);
  const importMapText = await Deno.readTextFile(IMPORT_MAP_PATH);
  const importMap = JSON.parse(importMapText);
  denoJson.imports = importMap.imports;
  denoJson.scopes = importMap.scopes;
  delete denoJson.importMap;
  await Deno.remove(IMPORT_MAP_PATH);
}

// Add Fresh lint preset
if (!denoJson.lint) {
  denoJson.lint = {};
}
if (!denoJson.lint.rules) {
  denoJson.lint.rules = {};
}
if (!denoJson.lint.rules.tags) {
  denoJson.lint.rules.tags = [];
}
if (!denoJson.lint.rules.tags.includes("fresh")) {
  denoJson.lint.rules.tags.push("fresh");
}
if (!denoJson.lint.rules.tags.includes("recommended")) {
  denoJson.lint.rules.tags.push("recommended");
}

// Remove old _fresh exclude where we added it separately to
// "lint" and "fmt"
const fmtExcludeIdx = denoJson?.fmt?.exclude?.indexOf("_fresh");
if (fmtExcludeIdx > -1) {
  denoJson.fmt.exclude.splice(fmtExcludeIdx, 1);
  if (denoJson.fmt.exclude.length === 0) {
    delete denoJson.fmt.exclude;
  }
  if (Object.keys(denoJson.fmt).length === 0) {
    delete denoJson.fmt;
  }
}

const lintExcludeIdx = denoJson?.lint?.exclude?.indexOf("_fresh");
if (lintExcludeIdx > -1) {
  denoJson.lint.exclude.splice(lintExcludeIdx, 1);
  if (denoJson.lint.exclude.length === 0) {
    delete denoJson.lint.exclude;
  }
  if (Object.keys(denoJson.lint).length === 0) {
    delete denoJson.lint;
  }
}

// Exclude _fresh dir from everything
if (!denoJson.exclude) {
  denoJson.exclude = [];
}
if (!denoJson.exclude.includes("**/_fresh/*")) {
  denoJson.exclude.push("**/_fresh/*");
}

if (!denoJson.tasks) {
  denoJson.tasks = {};
}
if (!denoJson.tasks.build) {
  denoJson.tasks.build = "deno run -A dev.ts build";
}
if (!denoJson.tasks.preview) {
  denoJson.tasks.preview = "deno run -A main.ts";
}

freshImports(denoJson.imports);
if (denoJson.imports["twind"]) {
  twindImports(denoJson.imports);
}
if (denoJson.imports["preact-render-to-string"]) {
  // https://github.com/denoland/fresh/pull/1684
  delete denoJson.imports["preact-render-to-string"];
}
await writeFormattedJson(DENO_JSON_PATH, denoJson);

// Code mod for classic JSX -> automatic JSX.
const JSX_CODEMOD =
  `This project is using the classic JSX transform. Would you like to update to the
automatic JSX transform? This will remove the /** @jsx h */ pragma from your
source code and add the jsx: "react-jsx" compiler option to your deno.json file.`;
if (denoJson.compilerOptions?.jsx !== "react-jsx" && confirm(JSX_CODEMOD)) {
  console.log("Updating config file...");
  denoJson.compilerOptions = denoJson.compilerOptions || {};
  denoJson.compilerOptions.jsx = "react-jsx";
  denoJson.compilerOptions.jsxImportSource = "preact";
  await writeFormattedJson(DENO_JSON_PATH, denoJson);

  const project = new Project();
  const sfs = project.addSourceFilesAtPaths(
    join(resolvedDirectory, "**", "*.{js,jsx,ts,tsx}"),
  );

  await Promise.all(sfs.map((sf) => {
    for (const d of sf.getImportDeclarations()) {
      if (d.getModuleSpecifierValue() !== "preact") continue;
      for (const n of d.getNamedImports()) {
        const name = n.getName();
        if (name === "h" || name === "Fragment") n.remove();
      }
      if (
        d.getNamedImports().length === 0 &&
        d.getNamespaceImport() === undefined &&
        d.getDefaultImport() === undefined
      ) {
        d.remove();
      }
    }

    let text = sf.getFullText();
    text = text.replaceAll("/** @jsx h */\n", "");
    text = text.replaceAll("/** @jsxFrag Fragment */\n", "");
    sf.replaceWithText(text);

    return sf.save();
  }));
}

// Code mod for class={tw`border`} to class="border".
const TWIND_CODEMOD =
  `This project is using an old version of the twind integration. Would you like to
update to the new twind plugin? This will remove the 'class={tw\`border\`}'
boilerplate from your source code replace it with the simpler 'class="border"'.`;
if (denoJson.imports["@twind"] && confirm(TWIND_CODEMOD)) {
  await Deno.remove(join(resolvedDirectory, denoJson.imports["@twind"]));

  delete denoJson.imports["@twind"];
  await writeFormattedJson(DENO_JSON_PATH, denoJson);

  const MAIN_TS = `/// <reference no-default-lib="true" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { start } from "$fresh/server.ts";
import manifest from "./fresh.gen.ts";

import twindPlugin from "$fresh/plugins/twind.ts";
import twindConfig from "./twind.config.ts";

await start(manifest, { plugins: [twindPlugin(twindConfig)] });\n`;
  const MAIN_TS_PATH = join(resolvedDirectory, "main.ts");
  await Deno.writeTextFile(MAIN_TS_PATH, MAIN_TS);

  const TWIND_CONFIG_TS = `import { Options } from "$fresh/plugins/twind.ts";

  export default {
    selfURL: import.meta.url,
  } as Options;
  `;
  await Deno.writeTextFile(
    join(resolvedDirectory, "twind.config.ts"),
    TWIND_CONFIG_TS,
  );

  const project = new Project();
  const sfs = project.addSourceFilesAtPaths(
    join(resolvedDirectory, "**", "*.{js,jsx,ts,tsx}"),
  );

  await Promise.all(sfs.map((sf) => {
    const nodes = sf.forEachDescendantAsArray();
    for (const n of nodes) {
      if (!n.wasForgotten() && Node.isJsxAttribute(n)) {
        const init = n.getInitializer();
        const name = n.getStructure().name;
        if (
          Node.isJsxExpression(init) &&
          (name === "class" || name === "className")
        ) {
          const expr = init.getExpression();
          if (Node.isTaggedTemplateExpression(expr)) {
            const tag = expr.getTag();
            if (Node.isIdentifier(tag) && tag.getText() === "tw") {
              const template = expr.getTemplate();
              if (Node.isNoSubstitutionTemplateLiteral(template)) {
                n.setInitializer(`"${template.getLiteralValue()}"`);
              }
            }
          } else if (expr?.getFullText() === `tw(props.class ?? "")`) {
            n.setInitializer(`{props.class}`);
          }
        }
      }
    }

    const text = sf.getFullText();
    const removeTw = [...text.matchAll(/tw[,\s`(]/g)].length === 1;

    for (const d of sf.getImportDeclarations()) {
      if (d.getModuleSpecifierValue() !== "@twind") continue;
      for (const n of d.getNamedImports()) {
        const name = n.getName();
        if (name === "tw" && removeTw) n.remove();
      }
      d.setModuleSpecifier("twind");
      if (
        d.getNamedImports().length === 0 &&
        d.getNamespaceImport() === undefined &&
        d.getDefaultImport() === undefined
      ) {
        d.remove();
      }
    }

    return sf.save();
  }));
}

// Add default _app.tsx if not present
const routes = Array.from(Deno.readDirSync(join(srcDirectory, "routes")));
if (!routes.find((entry) => entry.isFile && entry.name.startsWith("_app."))) {
  const APP_TSX = `import { AppProps } from "$fresh/server.ts";

export default function App({ Component }: AppProps) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${basename(resolvedDirectory)}</title>
      </head>
      <body>
        <Component />
      </body>
    </html>
  );
}`;
  await Deno.writeTextFile(
    join(srcDirectory, "routes", "_app.tsx"),
    APP_TSX,
  );
}

// Add _fresh/ to .gitignore if not already there
const gitignorePath = join(resolvedDirectory, ".gitignore");
if (existsSync(gitignorePath, { isFile: true })) {
  const gitignoreText = Deno.readTextFileSync(gitignorePath);
  if (!gitignoreText.includes("_fresh")) {
    Deno.writeTextFileSync(
      gitignorePath,
      "\n# Fresh build directory\n_fresh/\n",
      { append: true },
    );
  }
}

const manifest = await collect(srcDirectory);
await generate(srcDirectory, manifest);

async function findSrcDirectory(
  fileName: string,
  directory: string,
): Promise<string> {
  for await (const entry of walk(directory)) {
    if (entry.isFile && entry.name === fileName) {
      return dirname(entry.path);
    }
  }
  return resolvedDirectory;
}

async function writeFormattedJson(
  denoJsonPath: string,
  // deno-lint-ignore no-explicit-any
  denoJson: any,
): Promise<void> {
  const denoJsonText = JSON.stringify(denoJson);
  await Deno.writeTextFile(denoJsonPath, denoJsonText);
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "fmt",
      denoJsonPath,
    ],
  });
  await command.output();
}
