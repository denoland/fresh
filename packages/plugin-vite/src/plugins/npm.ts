import * as esbuild from "esbuild";
import MagicString from "magic-string";
import { denoPlugin } from "@deno/esbuild-plugin";
import * as path from "@std/path";
import { builtinModules, isBuiltin } from "node:module";
import type { Alias, AliasOptions } from "vite";
import { Loader, ResolutionMode } from "@deno/loader";
import { underline } from "@std/fmt/colors";

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

function normalizeId(id: string): string {
  return id.replaceAll("/", "__").replaceAll(".", "_");
}

export interface NpmEntry {
  id: string;
  name: string;
  entryName: string;
}

export async function getAllNpmEntries(
  json: PackageJson,
): Promise<NpmEntry[]> {
  const pkgId = `${normalizeId(json.name)}@${json.version}`;

  const entries: NpmEntry[] = [];

  if (json.exports) {
    if (typeof json.exports === "string") {
      entries.push({
        id: pkgId,
        entryName: json.name,
        name: "__default",
      });
    } else {
      for (const id of Object.keys(json.exports)) {
        if (!id.startsWith(".")) {
          entries.push({
            id: pkgId,
            entryName: json.name,
            name: "__default",
          });
          break;
        }

        if (id.includes("*")) {
          console.log("SKIPPING", json.name, id);
          continue;
        }

        entries.push({
          id: `${pkgId}${id.slice(1)}`,
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
    outdir: ".",
    sourcemap: "external",
    format: "esm",
    target: "esnext",
    platform: platform === "browser" ? "browser" : "node",
    entryPoints: entries.map((entry) => {
      return {
        in: entry.entryName,
        out: entry.id,
      };
    }),

    // entries.reduce<Record<string, string>>((acc, entry) => {
    //   acc[entry.entryName] = entry.entryName;
    //   return acc;
    // }, {}),
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
              if (filter.source.includes("@vite") || args.path === "vite") {
                return {
                  path: args.path,
                  external: true,
                };
              }

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

    const rel = path.relative(cwd, file.path);
    console.log({ f: file.path, cwd, rel });
    const url = path.toFileUrl(file.path).href;

    let code = file.text;

    let hasRequire = false;
    code = code.replaceAll(/__(require\(['"]node:[^)]+\))/g, (_, replace) => {
      hasRequire = true;
      return replace;
    });

    if (hasRequire) {
      code =
        `import { createRequire } from "node:module";const require = createRequire(import.meta.url);${code}`;
    }

    files.set(rel, {
      filePath: url,
      content: code,
      map: null,
    });
  }

  for (let i = 0; i < sourceMaps.length; i++) {
    const map = sourceMaps[i];

    const chunk = files.get(map.path.slice(-".map".length));
    if (chunk !== undefined) {
      chunk.map = map.text;
    }
  }

  if (pkgJson.name === "preact") {
    console.log(bundle);
  }

  console.log("OPTMIZING", pkgJson.name, pkgJson.version, "...done");

  for (const [id, chunk] of Object.entries(bundle.metafile.outputs)) {
    if (id.endsWith(".map")) continue;

    const file = path.toFileUrl(path.join(cwd, id)).href;

    if (chunk.entryPoint) {
      const bundled = files.get(file);

      if (bundled !== undefined) {
        console.log({ chunk: chunk.entryPoint });
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

export function reverseLookupNpm(
  pkgJson: PackageJson,
  dir: string,
  spec: string,
): string | undefined {
  // console.log(spec, pkgJson);

  const pkgId = `${normalizeId(pkgJson.name)}@${pkgJson.version}`;

  const idx = spec.lastIndexOf("/node_modules/");
  const part = "./" + spec.slice(idx + `/node_modules/${pkgJson.name}/`.length);

  if (pkgJson.exports) {
    if (typeof pkgJson.exports === "string") {
    } else {
      for (const [id, value] of Object.entries(pkgJson.exports)) {
        if (value === null) continue;

        if (id.startsWith(".")) {
          if (typeof value === "string") {
            if (value === part) {
            }
          } else {
            for (const [_subId, subValue] of Object.entries(value)) {
              if (subValue === null) continue;

              if (subValue === part) {
                return id === "." ? `${pkgId}` : `${pkgId}${id.slice(1)}`;
              }
            }
          }
        }
      }
    }
  } else if (
    pkgJson.module === spec || pkgJson.main === spec || part === "./index.js"
  ) {
    return pkgId;
  }

  console.log("FIXME", { part });
}
