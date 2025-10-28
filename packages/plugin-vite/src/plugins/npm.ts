import * as esbuild from "esbuild";
import * as path from "@std/path";
import { builtinModules, isBuiltin } from "node:module";
import type { Alias, AliasOptions } from "vite";
import { type Loader, ResolutionMode } from "@deno/loader";
import * as cjsLexer from "cjs-module-lexer";
import { walk } from "@std/fs/walk";

await cjsLexer.init();

export interface PackageJson {
  name: string;
  version: string;
  exports?:
    | string
    | Record<string, string | Record<string, string | Record<string, string>>>;
  main?: string;
  module?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
}

export async function readPackageJson(file: string): Promise<PackageJson> {
  return JSON.parse(await Deno.readTextFile(file));
}

function normalizeId(id: string): string {
  return id.replaceAll("/", "__");
}

export interface NpmEntry {
  id: string;
  entryName: string;
}

export async function getAllNpmEntries(
  json: PackageJson,
  dir: string,
): Promise<Map<string, NpmEntry>> {
  const pkgId = `${normalizeId(json.name)}@${json.version}`;

  const byId = new Map<string, NpmEntry>();

  if (json.exports) {
    if (typeof json.exports === "string") {
      byId.set(pkgId, {
        id: pkgId,
        entryName: json.name,
      });
    } else {
      for (const id of Object.keys(json.exports)) {
        if (!id.startsWith(".")) {
          byId.set(pkgId, {
            id: pkgId,
            entryName: json.name,
          });
          break;
        }

        if (id.includes("*")) {
          if (json.name === "cloudflare" && id.includes("/_shims/")) {
            const raw = id.slice(1)
              .replaceAll(".", "\\\\.")
              .replaceAll("*", ".*")
              .replaceAll("/", "[/\\\\]+");

            const tmp = path.normalize(id);

            let nearestDir = dir;
            for (const part of tmp.split(/[/\\]+/)) {
              if (part.includes("*")) break;
              nearestDir = path.join(nearestDir, part);
            }

            const reg = new RegExp(raw);
            console.log("WALK CCC", nearestDir, reg);
            for await (
              const entry of walk(nearestDir, {
                includeDirs: false,
                includeFiles: true,
                match: [reg],
              })
            ) {
              if (entry.name.endsWith(".map") || entry.name.endsWith(".d.ts")) {
                continue;
              }

              if (
                json.name === "cloudflare" && id.includes("_shim") &&
                entry.name.endsWith(".js")
              ) {
                continue;
              }

              console.log("WALk EEEE", entry);

              const rel = path.relative(dir, entry.path).replaceAll(
                /[/\\]+/g,
                "/",
              );

              const entryId = `${pkgId}__${normalizeId(rel)}`;

              let entryName = `${json.name}`;
              const entryDir = path.dirname(rel);
              if (entryDir !== ".") {
                entryName += `/${entryDir}`;
              }
              entryName += `/${path.basename(rel, path.extname(rel))}`;

              byId.set(entryId, {
                id: entryId,
                entryName,
              });
              console.log("BYID", byId);

              continue;
            }
          }
          console.log("SKIPPING", json.name, id);
          continue;
        }

        const entryid = `${pkgId}${normalizeId(id.slice(1))}`;
        byId.set(entryid, {
          id: entryid,
          entryName: `${json.name}${id.slice(1)}`,
        });
      }
    }
  } else {
    byId.set(pkgId, {
      id: pkgId,
      entryName: json.name,
    });
  }

  return byId;
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
  const pkgId = `${normalizeId(pkgJson.name)}@${pkgJson.version}`;

  const entries = await getAllNpmEntries(pkgJson, dir);

  let cwd = dir;
  while (path.basename(cwd) !== "node_modules") {
    cwd = path.dirname(cwd);
  }

  cwd = path.dirname(cwd);

  const external: string[] = [
    "npm:*",
    "jsr:*",
    "http:*",
    "https:*",
    "node:*",
    "vite",
    "rollup",
    ...builtinModules,
  ];

  if (pkgJson.dependencies) {
    external.push(...Object.keys(pkgJson.dependencies));
  }
  if (pkgJson.devDependencies) {
    external.push(...Object.keys(pkgJson.devDependencies));
  }
  if (pkgJson.optionalDependencies) {
    external.push(...Object.keys(pkgJson.optionalDependencies));
  }

  if (pkgJson.name === "cloudflare") {
    console.log("CFF", { entries });
  }

  const bundle = await esbuild.build({
    write: false,
    bundle: true,
    metafile: true,
    absWorkingDir: cwd,
    splitting: true,
    chunkNames: `${platform}__${pkgId}__chunk-[hash]`,
    outdir: ".",
    sourcemap: "external",
    format: "esm",
    target: "esnext",
    platform: platform === "browser" ? "browser" : "node",
    entryPoints: Array.from(entries.values()).map((entry) => {
      return {
        in: entry.entryName,
        out: `${platform}__${entry.id}`,
      };
    }),

    logLevel: "debug",
    external,
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

              console.log("ALIAS", resolved, entry);

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
                if (pkgJson.name === "cloudflare") {
                  console.log({ p: args.path });
                }
                const res = await loader.resolve(
                  args.path,
                  args.importer || path.join(dir, "index.js"),
                  ResolutionMode.Import,
                );

                let result = res;
                if (res.startsWith("file://")) {
                  result = path.fromFileUrl(result);
                }

                // Use `module` entry if resolved to `main` instead.
                if (
                  typeof pkgJson.main === "string" &&
                  typeof pkgJson.module === "string" &&
                  result === path.join(dir, pkgJson.main)
                ) {
                  const moduleEntry = path.join(dir, pkgJson.module);
                  return {
                    path: moduleEntry,
                  };
                }

                return {
                  path: result,
                };
              }

              if (!args.path.startsWith(".")) {
                return {
                  path: args.path,
                  external: true,
                };
              }

              return null;
            });
          }
        },
      },
    ],
  });

  const files = new Map<string, BundleFile>();

  const outputFileByPath = new Map<string, esbuild.OutputFile>();

  for (let i = 0; i < bundle.outputFiles.length; i++) {
    const file = bundle.outputFiles[i];

    const id = path.relative(cwd, file.path);
    outputFileByPath.set(id, file);
  }

  console.log("OPTMIZING", pkgJson.name, pkgJson.version, "...done");

  for (const [id, chunk] of Object.entries(bundle.metafile.outputs)) {
    if (id.endsWith(".map")) continue;

    const file = outputFileByPath.get(id);
    if (!file) throw new Error(`Could not find output file: ${id}`);

    let code = file.text;

    let hasRequire = false;
    code = code
      .replaceAll(/__(require\(['"]node:[^)]+\))/g, (_, replace) => {
        hasRequire = true;
        return replace;
      })
      .replaceAll(/['"]\.\/([^'"]+chunk-\w+\.js)['"]/g, (m, spec) => {
        return `${m[0]}deno-npm::${spec}${m[m.length - 1]}`;
      });

    if (hasRequire) {
      code =
        `import { createRequire } from "node:module";const require = createRequire(import.meta.url);${code}`;
    }

    const map = outputFileByPath.get(id + ".map")?.text ?? null;

    // Reconstruct exports
    if (chunk.entryPoint) {
      const inputFile = bundle.metafile.inputs[chunk.entryPoint];
      if (inputFile.format === "cjs") {
        code = code.replace(/^export default (.*);/gm, (_, spec) => {
          return `var __default = ${spec};\n`;
        });
        code += `export default __default;\n`;
        const source = await Deno.readTextFile(
          path.join(cwd, chunk.entryPoint),
        );

        const result = await cjsLexer.parse(source);

        for (let i = 0; i < result.exports.length; i++) {
          const name = result.exports[i];
          if (name === "default") continue;

          code += `export var ${name} = __default["${name}"];\n`;
        }
      }
    }

    const bundleFile: BundleFile = {
      content: code,
      filePath: path.join(dir, id),
      map,
    };

    files.set(id, bundleFile);
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
) {
  let result = reverseLookupNpmInner(pkgJson, dir, spec);

  if (result !== undefined) {
    result = normalizeId(result);
    if (!/\.(map|[mc]?[tj]s)$/.test(result)) {
      result += ".js";
    }
    return result;
  }

  return result;
}

export function reverseLookupNpmInner(
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
  return `${pkgId}${part.slice(1)}`;
}
