import { join, Node, parse, Project, resolve } from "./src/dev/deps.ts";
import { error } from "./src/dev/error.ts";
import { freshImports, twindImports } from "./src/dev/imports.ts";
import { collect, ensureMinDenoVersion, generate } from "./src/dev/mod.ts";

ensureMinDenoVersion();

const help = `fresh-update

Update a Fresh project. This updates dependencies and optionally performs code
mods to update a project's source code to the latest recommended patterns.

To upgrade a projecct in the current directory, run:
  fresh-update .

USAGE:
    fresh-update <DIRECTORY>
`;

const flags = parse(Deno.args, {});

if (flags._.length !== 1) {
  error(help);
}

const unresolvedDirectory = Deno.args[0];
const resolvedDirectory = resolve(unresolvedDirectory);

// Update dependencies in the import map.
const IMPORT_MAP_PATH = join(resolvedDirectory, "import_map.json");
let importMapText = await Deno.readTextFile(IMPORT_MAP_PATH);
const importMap = JSON.parse(importMapText);
freshImports(importMap.imports);
if (importMap.imports["twind"]) {
  twindImports(importMap.imports);
}
importMapText = JSON.stringify(importMap, null, 2);
await Deno.writeTextFile(IMPORT_MAP_PATH, importMapText);

// Code mod for classic JSX -> automatic JSX.
const JSX_CODEMOD =
  `This project is using the classic JSX transform. Would you like to update to the
automatic JSX transform? This will remove the /** @jsx h */ pragma from your
source code and add the jsx: "react-jsx" compiler option to your deno.json file.`;
const DENO_JSON_PATH = join(resolvedDirectory, "deno.json");
let denoJsonText = await Deno.readTextFile(DENO_JSON_PATH);
const denoJson = JSON.parse(denoJsonText);
if (denoJson.compilerOptions?.jsx !== "react-jsx" && confirm(JSX_CODEMOD)) {
  console.log("Updating config file...");
  denoJson.compilerOptions = denoJson.compilerOptions || {};
  denoJson.compilerOptions.jsx = "react-jsx";
  denoJson.compilerOptions.jsxImportSource = "preact";
  denoJsonText = JSON.stringify(denoJson, null, 2);
  await Deno.writeTextFile(DENO_JSON_PATH, denoJsonText);

  const project = new Project();
  const sfs = project.addSourceFilesAtPaths(
    join(resolvedDirectory, "**", "*.{js,jsx,ts,tsx}"),
  );

  for (const sf of sfs) {
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

    await sf.save();
  }
}

// Code mod for class={tw`border`} to class="border".
const TWIND_CODEMOD =
  `This project is using an old version of the twind integration. Would you like to
update to the new twind plugin? This will remove the 'class={tw\`border\`}'
boilerplate from your source code replace it with the simpler 'class="border"'.`;
if (importMap.imports["@twind"] && confirm(TWIND_CODEMOD)) {
  await Deno.remove(join(resolvedDirectory, importMap.imports["@twind"]));

  delete importMap.imports["@twind"];
  importMapText = JSON.stringify(importMap, null, 2);
  await Deno.writeTextFile(IMPORT_MAP_PATH, importMapText);

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

  for (const sf of sfs) {
    const nodes = sf.forEachDescendantAsArray();
    for (const n of nodes) {
      if (!n.wasForgotten() && Node.isJsxAttribute(n)) {
        const init = n.getInitializer();
        const name = n.getName();
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

    await sf.save();
  }
}

const manifest = await collect(resolvedDirectory);
await generate(resolvedDirectory, manifest);
