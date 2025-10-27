import * as esbuild from "esbuild";
import MagicString from "magic-string";
import { denoPlugin } from "@deno/esbuild-plugin";
import * as path from "@std/path";
import { builtinModules, isBuiltin } from "node:module";
import type { Alias, AliasOptions } from "vite";
import { Loader, ResolutionMode } from "@deno/loader";

export interface PackageJson {
  name: string;
  version: string;
  exports?:
    | string
    | Record<string, string | Record<string, string | Record<string, string>>>;
  main?: string;
  module?: string;
}

export async function readPackageJson(file: string): Promise<PackageJson> {
  return JSON.parse(await Deno.readTextFile(file));
}

export interface NpmEntry {
  id: string;
  name: string;
  entryName: string;
}

export async function getAllNpmEntries(
  json: PackageJson,
): Promise<NpmEntry[]> {
  const entries: NpmEntry[] = [];

  if (json.exports) {
    if (typeof json.exports === "string") {
      entries.push({
        id: json.name,
        entryName: json.name,
        name: "__default",
      });
    } else {
      for (const id of Object.keys(json.exports)) {
        if (!id.startsWith(".")) {
          entries.push({
            id: json.name,
            entryName: json.name,
            name: "__default",
          });
          break;
        }

        if (id.includes("*")) {
          console.log("SKIPPING", json.name, id);
          continue;
        }
        // console.log({ id });

        entries.push({
          id: json.name,
          entryName: `${json.name}${id.slice(1)}`,
          name: id.slice(2).replace(/[./@]/g, "_"),
        });
      }
    }
  } else {
    entries.push({
      id: json.name,
      entryName: json.name,
      name: "__default",
    });
  }

  if (json.name === "preact") {
    console.log("PREACT", entries);
  }

  return entries;
}

export interface BundleFile {
  filePath: string;
  content: string;
  map: string | null;
}

export interface BundleResult {
  name: string;
  version: string;
  files: Map<string, BundleFile>;
}

export async function bundleNpmPackage(
  dir: string,
  platform: "browser" | "ssr",
  loader: Loader,
  aliases: (AliasOptions | undefined) & Alias[],
): Promise<BundleResult> {
  const pkgJson = await readPackageJson(path.join(dir, "package.json"));

  const entries = await getAllNpmEntries(pkgJson);
  console.log(entries);

  let cwd = dir;
  while (path.basename(cwd) !== "node_modules") {
    cwd = path.dirname(cwd);
  }

  cwd = path.dirname(cwd);
  console.log("OPTMIZING", pkgJson.name, pkgJson.version, entries, cwd);

  const bundle = await esbuild.build({
    write: false,
    bundle: true,
    metafile: true,
    absWorkingDir: cwd,
    outdir: dir,
    sourcemap: "external",
    format: "esm",
    target: "esnext",
    platform: platform === "browser" ? "browser" : "node",
    entryPoints: entries.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.entryName] = entry.entryName;
      return acc;
    }, {}),
    logLevel: "debug",
    plugins: [
      {
        name: "fresh:alias",
        setup(ctx) {
          for (let i = 0; i < aliases.length; i++) {
            const entry = aliases[i];
            const filter = typeof entry.find === "string"
              ? new RegExp("^" + entry.find.replaceAll("/", "\\/") + "$")
              : entry.find;

            ctx.onResolve({ filter }, async (args) => {
              const resolved = await ctx.resolve(entry.replacement, {
                importer: args.importer,
                resolveDir: args.resolveDir,
                with: args.with,
                kind: args.kind,
                namespace: args.namespace,
              });

              return resolved;
            });

            ctx.onResolve({ filter: /\.node$/ }, (args) => {
              return {
                path: args.path,
                external: true,
              };
            });

            ctx.onResolve({ filter: /.*/ }, async (args) => {
              if (isBuiltin(args.path)) {
                let mapped = args.path;
                if (
                  !mapped.startsWith("node:") && isBuiltin(`node:${mapped}`)
                ) {
                  mapped = `node:${mapped}`;
                }
                return {
                  path: mapped,
                  external: true,
                };
              }

              if (args.kind === "entry-point") {
                const res = await loader.resolve(
                  `npm:` + args.path,
                  args.importer,
                  ResolutionMode.Import,
                );

                let result = res;
                if (res.startsWith("file://")) {
                  result = path.fromFileUrl(result);
                }
                console.log({ arg: args.path, res, result });
                return {
                  path: result,
                };
              }

              return null;
            });
          }
        },
      },
      // denoPlugin({}),
    ],
    external: [
      "npm:*",
      "jsr:*",
      "http:*",
      "https:*",
      "node:*",
      "vite",
      "rollup",
      ...builtinModules,
    ],
  });

  console.log("DONE");
  const files = new Map<string, BundleFile>();

  const sourceMaps: esbuild.OutputFile[] = [];

  for (let i = 0; i < bundle.outputFiles.length; i++) {
    const file = bundle.outputFiles[i];

    if (file.path.endsWith(".map")) {
      sourceMaps.push(file);
      continue;
    }

    const url = path.toFileUrl(file.path).href;

    let code = file.text;

    let hasRequire = false;
    code = code.replaceAll(/__(require\(['"]node:[^)]+\))/g, (m, replace) => {
      hasRequire = true;
      return replace;
    });

    if (hasRequire) {
      code =
        `import { createRequire } from "node:module";const require = createRequire(import.meta.url);${code}`;
    }

    files.set(url, {
      filePath: url,
      content: code,
      map: null,
    });
  }

  if (pkgJson.name === "preact") {
    console.log(bundle.metafile);
  }

  for (let i = 0; i < sourceMaps.length; i++) {
    const map = sourceMaps[i];

    const chunk = files.get(map.path.slice(-".map".length));
    if (chunk !== undefined) {
      chunk.map = map.text;
    }
  }

  console.log("OPTMIZING", pkgJson.name, pkgJson.version, "...done");

  for (const [rel, chunk] of Object.entries(bundle.metafile.outputs)) {
    if (rel.endsWith(".map")) continue;

    const file = path.toFileUrl(path.join(cwd, rel)).href;

    if (chunk.entryPoint) {
      const bundled = files.get(file);

      if (bundled !== undefined) {
        const entryPath = path.toFileUrl(path.join(cwd, chunk.entryPoint)).href;
        files.set(entryPath, bundled);
      }
    }
  }

  return {
    name: pkgJson.name,
    version: pkgJson.version,
    files,
  };
}
