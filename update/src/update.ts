import * as path from "@std/path";
import * as JSONC from "@std/jsonc";
import { walk } from "@std/fs/walk";
import * as tsmorph from "ts-morph";

export const FRESH_VERSION = "2.0.0-alpha.1";
export const PREACT_VERSION = "10.20.2";
export const PREACT_SIGNALS_VERSION = "1.2.3";

export interface DenoJson {
  imports?: Record<string, string>;
}

async function format(filePath: string) {
  const command = new Deno.Command(Deno.execPath(), {
    args: ["fmt", filePath],
  });
  await command.output();
}

async function writeFormatted(filePath: string, content: string) {
  await Deno.writeTextFile(filePath, content);
  await format(filePath);
}

async function updateDenoJson(
  dir: string,
  fn: (json: DenoJson) => void | Promise<void>,
): Promise<void> {
  let filePath = path.join(dir, "deno.json");
  try {
    const config = JSON.parse(await Deno.readTextFile(filePath)) as DenoJson;
    await fn(config);
    await writeFormatted(filePath, JSON.stringify(config));
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  filePath = path.join(dir, "deno.jsonc");
  try {
    const config = JSONC.parse(await Deno.readTextFile(filePath)) as DenoJson;
    await fn(config);
    await writeFormatted(filePath, JSON.stringify(config));
    return;
  } catch (err) {
    if (!(err instanceof Deno.errors.NotFound)) {
      throw err;
    }
  }

  throw new Error(`Could not find deno.json or deno.jsonc in: ${dir}`);
}

export async function update(dir: string) {
  // Update config
  await updateDenoJson(dir, (config) => {
    if (config.imports !== null && typeof config.imports !== "object") {
      config.imports = {};
    }

    config.imports["@fresh/core"] = `jsr:@fresh/core@^${FRESH_VERSION}`;
    config.imports["preact"] = `npm:preact@^${PREACT_VERSION}`;
    config.imports["@preact/signals"] =
      `npm:@preact/signals@^${PREACT_SIGNALS_VERSION}`;
  });

  // Update routes folder
  const routesDir = path.join(dir, "routes");
  try {
    await Deno.stat(routesDir);

    for await (
      const entry of walk(path.join(dir, "routes"), {
        includeDirs: false,
        includeFiles: true,
        match: [/\.[tj]sx?$/],
      })
    ) {
      if (!entry.isFile) continue;

      const project = new tsmorph.Project();
      const sfs = project.addSourceFilesAtPaths(
        path.join(dir, "**", "*.{js,jsx,ts,tsx}"),
      );
      await Promise.all(sfs.map(async (sourceFile) => {
        for (const d of sourceFile.getImportDeclarations()) {
          const specifier = d.getModuleSpecifierValue();
          if (specifier === "preact") {
            for (const n of d.getNamedImports()) {
              const name = n.getName();
              if (name === "h" || name === "Fragment") n.remove();
            }

            removeEmptyImport(d);
          } else if (specifier === "$fresh/server.ts") {
            d.setModuleSpecifier("@fresh/core");
          } else if (specifier === "$fresh/runtime.ts") {
            d.setModuleSpecifier("@fresh/core/runtime");

            for (const n of d.getNamedImports()) {
              const name = n.getName();
              if (name === "Head") n.remove();
            }

            removeEmptyImport(d);
          }
        }

        let text = sourceFile.getFullText();
        text = text.replaceAll("/** @jsx h */\n", "");
        text = text.replaceAll("/** @jsxFrag Fragment */\n", "");
        sourceFile.replaceWithText(text);

        for (const [name, decl] of sourceFile.getExportedDeclarations()) {
          if (name === "handler") {
            const maybeObjs = decl[0].getChildrenOfKind(
              tsmorph.ts.SyntaxKind.ObjectLiteralExpression,
            );
            if (maybeObjs.length > 0) {
              const obj = maybeObjs[0];
              for (const property of obj.getProperties()) {
                if (property.isKind(tsmorph.ts.SyntaxKind.MethodDeclaration)) {
                  const name = property.getName();
                  if (
                    name === "GET" || name === "POST" || name === "PATCH" ||
                    name === "PUT" || name === "DELETE"
                  ) {
                    let hasRequestVar = false;
                    const params = property.getParameters();
                    if (params.length > 0) {
                      const paramName = params[0].getName();

                      hasRequestVar = paramName === "req";
                      if (hasRequestVar || paramName === "_req") {
                        params[0].remove();
                      }
                    }

                    if (hasRequestVar) {
                      property.insertVariableStatement(0, {
                        declarationKind: tsmorph.VariableDeclarationKind.Const,
                        declarations: [{
                          name: "req",
                          initializer: "ctx.req",
                        }],
                      });
                    }
                    // console.log(params);
                  }
                }
              }
            } else if (tsmorph.Node.isFunctionDeclaration(decl[0])) {
              const d = decl[0];
              const params = d.getParameters();
              let hasRequestParam = false;
              if (params.length > 0) {
                const paramName = params[0].getName();
                hasRequestParam = paramName === "req";
                if (hasRequestParam || paramName === "_req") {
                  params[0].remove();
                }

                if (hasRequestParam) {
                  d.insertVariableStatement(0, {
                    declarationKind: tsmorph.VariableDeclarationKind.Const,
                    declarations: [{
                      name: "req",
                      initializer: "ctx.req",
                    }],
                  });
                }
              }
            }
          }
        }

        await sourceFile.save();
        await format(sourceFile.getFilePath());
      }));
    }
  } catch (_) {
    // TODO
  }
}

function removeEmptyImport(d: tsmorph.ImportDeclaration) {
  if (
    d.getNamedImports().length === 0 &&
    d.getNamespaceImport() === undefined &&
    d.getDefaultImport() === undefined
  ) {
    d.remove();
  }
}
