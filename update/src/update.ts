import * as path from "@std/path";
import * as JSONC from "@std/jsonc";
import * as tsmorph from "ts-morph";

export const SyntaxKind = tsmorph.ts.SyntaxKind;

export const FRESH_VERSION = "2.0.0-alpha.34";
export const PREACT_VERSION = "10.26.6";
export const PREACT_SIGNALS_VERSION = "2.0.4";

export interface DenoJson {
  lock?: boolean;
  tasks?: Record<string, string>;
  name?: string;
  version?: string;
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

export interface ImportState {
  core: Set<string>;
  runtime: Set<string>;
  compat: Set<string>;
}

const compat = new Set([
  "defineApp",
  "defineLayout",
  "defineRoute",
  "AppProps",
  "ErrorPageProps",
  "Handler",
  "Handlers",
  "LayoutProps",
  "RouteContext",
  "UnknownPageProps",
]);

export async function updateProject(dir: string) {
  // Update config
  await updateDenoJson(dir, (config) => {
    if (config.imports !== null && typeof config.imports !== "object") {
      config.imports = {};
    }

    config.imports["fresh"] = `jsr:@fresh/core@^${FRESH_VERSION}`;
    config.imports["preact"] = `npm:preact@^${PREACT_VERSION}`;
    config.imports["@preact/signals"] =
      `npm:@preact/signals@^${PREACT_SIGNALS_VERSION}`;
    delete config.imports["$fresh/"];
    delete config.imports["@preact/signals-core"];
    delete config.imports["preact-render-to-string"];

    // We should always use a lockfile going forwards
    if ("lock" in config) {
      delete config.lock;
    }

    // Update Fresh 1.x tasks
    const tasks = config.tasks;
    if (tasks !== undefined) {
      if (tasks.manifest === "deno task cli manifest $(pwd)") {
        delete tasks.manifest;
      }

      if (
        tasks.cli ===
          "echo \"import '\\$fresh/src/dev/cli.ts'\" | deno run --unstable -A -" ||
        tasks.cli ===
          "echo \"import '$fresh/src/dev/cli.ts'\" | deno run --unstable -A -"
      ) {
        delete tasks.cli;
      }

      if (tasks.update === "deno run -A -r https://fresh.deno.dev/update .") {
        tasks.update = "deno run -A -r jsr:@fresh/update .";
      }

      if (
        tasks.check ===
          "deno fmt --check && deno lint && deno check **/*.ts && deno check **/*.tsx"
      ) {
        tasks.check = "deno fmt --check && deno lint && deno check";
      }
    }
  });

  // Update routes folder
  const project = new tsmorph.Project();
  const sfs = project.addSourceFilesAtPaths(
    path.join(dir, "**", "*.{js,jsx,ts,tsx}"),
  );
  await Promise.all(sfs.map(async (sourceFile) => {
    try {
      return await updateFile(sourceFile);
    } catch (err) {
      // deno-lint-ignore no-console
      console.error(`Could not process ${sourceFile.getFilePath()}`);
      throw err;
    }
  }));
}

async function updateFile(sourceFile: tsmorph.SourceFile): Promise<void> {
  const newImports: ImportState = {
    core: new Set(),
    runtime: new Set(),
    compat: new Set(),
  };

  const text = sourceFile.getFullText()
    .replaceAll("/** @jsx h */\n", "")
    .replaceAll("/** @jsxFrag Fragment */\n", "")
    .replaceAll('/// <reference no-default-lib="true" />\n', "")
    .replaceAll('/// <reference lib="dom" />\n', "")
    .replaceAll('/// <reference lib="dom.iterable" />\n', "")
    .replaceAll('/// <reference lib="dom.asynciterable" />\n', "")
    .replaceAll('/// <reference lib="deno.ns" />\n', "");
  sourceFile.replaceWithText(text);

  if (
    sourceFile.getFilePath().includes("/routes/") &&
    !sourceFile.getDirectoryPath().includes("/(_")
  ) {
    for (const [name, decl] of sourceFile.getExportedDeclarations()) {
      if (name === "handler") {
        const node = decl[0];
        if (node.isKind(SyntaxKind.VariableDeclaration)) {
          const init = node.getInitializer();
          if (
            init !== undefined &&
            init.isKind(SyntaxKind.ObjectLiteralExpression)
          ) {
            for (const property of init.getProperties()) {
              if (property.isKind(SyntaxKind.MethodDeclaration)) {
                const name = property.getName();
                if (
                  name === "GET" || name === "POST" || name === "PATCH" ||
                  name === "PUT" || name === "DELETE"
                ) {
                  const body = property.getBody();
                  if (body !== undefined) {
                    const stmts = body.getDescendantStatements();
                    rewriteCtxMethods(stmts);
                  }

                  maybePrependReqVar(property, newImports, true);
                }
              } else if (property.isKind(SyntaxKind.PropertyAssignment)) {
                const init = property.getInitializer();
                if (
                  init !== undefined &&
                  (init.isKind(SyntaxKind.ArrowFunction) ||
                    init.isKind(SyntaxKind.FunctionExpression))
                ) {
                  const body = init.getBody();
                  if (body !== undefined) {
                    const stmts = body.getDescendantStatements();
                    rewriteCtxMethods(stmts);
                  }

                  maybePrependReqVar(init, newImports, true);
                }
              }
            }
          }
        } else if (node.isKind(SyntaxKind.FunctionDeclaration)) {
          const body = node.getBody();
          if (body !== undefined) {
            const stmts = body.getDescendantStatements();
            rewriteCtxMethods(stmts);
          }

          maybePrependReqVar(node, newImports, false);
        }
      } else if (name === "default" && decl.length > 0) {
        const caller = decl[0];
        if (caller.isKind(SyntaxKind.CallExpression)) {
          const expr = caller.getExpression();
          if (expr.isKind(SyntaxKind.Identifier)) {
            const text = expr.getText();
            if (
              text === "defineApp" || text === "defineLayout" ||
              text === "defineRoute"
            ) {
              const args = caller.getArguments();
              if (args.length > 0) {
                const first = args[0];
                if (
                  first.isKind(SyntaxKind.ArrowFunction) ||
                  first.isKind(SyntaxKind.FunctionExpression)
                ) {
                  const body = first.getBody();
                  if (body !== undefined) {
                    const stmts = body.getDescendantStatements();
                    rewriteCtxMethods(stmts);
                  }

                  maybePrependReqVar(first, newImports, false);
                }
              }
            }
          }
        } else if (caller.isKind(SyntaxKind.FunctionDeclaration)) {
          const body = caller.getBody();
          if (body !== undefined) {
            const stmts = body.getDescendantStatements();
            rewriteCtxMethods(stmts);
          }

          maybePrependReqVar(caller, newImports, false);
        }
      }
    }
  }

  let hasCoreImport = false;
  let hasRuntimeImport = false;
  for (const d of sourceFile.getImportDeclarations()) {
    const specifier = d.getModuleSpecifierValue();
    if (specifier === "preact") {
      for (const n of d.getNamedImports()) {
        const name = n.getName();
        if (name === "h" || name === "Fragment") n.remove();
      }

      removeEmptyImport(d);
    } else if (specifier === "$fresh/server.ts") {
      hasCoreImport = true;
      d.setModuleSpecifier("fresh");

      for (const n of d.getNamedImports()) {
        const name = n.getName();
        newImports.core.delete(name);
        if (compat.has(name)) {
          n.remove();
          newImports.compat.add(name);
        }
      }
      if (newImports.core.size > 0) {
        newImports.core.forEach((name) => {
          d.addNamedImport(name);
        });
      }

      removeEmptyImport(d);
    } else if (specifier === "$fresh/runtime.ts") {
      hasRuntimeImport = true;
      d.setModuleSpecifier("fresh/runtime");

      for (const n of d.getNamedImports()) {
        const name = n.getName();
        newImports.runtime.delete(name);
      }
      if (newImports.runtime.size > 0) {
        newImports.runtime.forEach((name) => {
          d.addNamedImport(name);
        });
      }

      removeEmptyImport(d);
    }
  }

  if (!hasCoreImport && newImports.core.size > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "fresh",
      namedImports: Array.from(newImports.core),
    });
  }
  if (!hasRuntimeImport && newImports.runtime.size > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "fresh/runtime",
      namedImports: Array.from(newImports.core),
    });
  }
  if (newImports.compat.size > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "fresh/compat",
      namedImports: Array.from(newImports.compat),
    });
  }

  await sourceFile.save();
  await format(sourceFile.getFilePath());
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

function maybePrependReqVar(
  method:
    | tsmorph.MethodDeclaration
    | tsmorph.FunctionDeclaration
    | tsmorph.FunctionExpression
    | tsmorph.ArrowFunction,
  newImports: ImportState,
  hasInferredTypes: boolean,
) {
  let hasRequestVar = false;
  const params = method.getParameters();
  if (params.length > 0) {
    const paramName = params[0].getName();

    // Add explicit types if the user did that
    if (hasInferredTypes && params[0].getTypeNode()) {
      hasInferredTypes = false;
    }

    hasRequestVar = params.length > 1 || paramName === "req";
    if (hasRequestVar || paramName === "_req") {
      if (hasRequestVar && params.length === 1) {
        params[0].replaceWithText("ctx");
        if (!hasInferredTypes) {
          newImports.core.add("FreshContext");
          params[0].setType("FreshContext");
        }
      } else {
        params[0].remove();

        // Use proper type
        if (params.length > 1) {
          const initType = params[1].getTypeNode()?.getText();
          if (initType !== undefined && initType === "RouteContext") {
            newImports.core.add("FreshContext");
            params[1].setType("FreshContext");
          }
        }
      }
    }
    const maybeObjBinding = params.length > 1
      ? params[1].getNameNode()
      : undefined;

    if (method.isKind(SyntaxKind.ArrowFunction)) {
      const body = method.getBody();
      if (!body.isKind(SyntaxKind.Block)) {
        // deno-lint-ignore no-console
        console.warn(`Cannot transform arrow function`);
        return;
      }
    }

    if (
      (maybeObjBinding === undefined ||
        !maybeObjBinding.isKind(SyntaxKind.ObjectBindingPattern)) &&
      hasRequestVar &&
      !paramName.startsWith("_")
    ) {
      method.insertVariableStatement(0, {
        declarationKind: tsmorph.VariableDeclarationKind.Const,
        declarations: [{
          name: paramName,
          initializer: "ctx.req",
        }],
      });
    }

    if (
      maybeObjBinding !== undefined &&
      maybeObjBinding.isKind(SyntaxKind.ObjectBindingPattern)
    ) {
      const bindings = maybeObjBinding.getElements();
      if (bindings.length > 0) {
        let needsRemoteAddr = false;
        for (let i = 0; i < bindings.length; i++) {
          const binding = bindings[i];
          const name = binding.getName();
          if (name === "remoteAddr") {
            binding.replaceWithText("info");
            needsRemoteAddr = true;
          }
        }
        if (hasRequestVar && !paramName.startsWith("_")) {
          const txt = maybeObjBinding.getFullText().slice(0, -2);
          maybeObjBinding.replaceWithText(txt + ", req }");
        }

        if (needsRemoteAddr) {
          method.insertVariableStatement(0, {
            declarationKind: tsmorph.VariableDeclarationKind.Const,
            declarations: [{
              name: "remoteAddr",
              initializer: "info.remoteAddr",
            }],
          });
        }
      }
    }
  }
}

function rewriteCtxMethods(
  nodes: (tsmorph.Node<tsmorph.ts.Node>)[],
) {
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];

    if (node.isKind(SyntaxKind.PropertyAccessExpression)) {
      rewriteCtxMemberName(node);
    } else if (node.isKind(SyntaxKind.ReturnStatement)) {
      const expr = node.getExpression();
      if (expr !== undefined) {
        rewriteCtxMethods([expr]);
      }
    } else if (node.isKind(SyntaxKind.VariableStatement)) {
      const decls = node.getDeclarations();
      for (let i = 0; i < decls.length; i++) {
        const decl = decls[i];
        const init = decl.getInitializer();
        if (init !== undefined) {
          rewriteCtxMethods([init]);
        }
      }
    } else if (
      node.isKind(SyntaxKind.ExpressionStatement) ||
      node.isKind(SyntaxKind.AwaitExpression) ||
      node.isKind(SyntaxKind.CallExpression)
    ) {
      const expr = node.getExpression();
      rewriteCtxMethods([expr]);
    } else if (node.isKind(SyntaxKind.BinaryExpression)) {
      rewriteCtxMethods([node.getLeft()]);
      rewriteCtxMethods([node.getRight()]);
    } else if (
      !node.isKind(SyntaxKind.ExpressionStatement) &&
      node.getKindName().endsWith("Statement")
    ) {
      const inner = node.getDescendantStatements();
      rewriteCtxMethods(inner);
    }
  }
}

function rewriteCtxMemberName(
  node: tsmorph.PropertyAccessExpression,
) {
  const children = node.getChildren();
  if (children.length === 0) return;
  const last = children[children.length - 1];

  if (
    node.getExpression().getText() === "ctx" &&
    node.getName() === "remoteAddr"
  ) {
    node.getExpression().replaceWithText("ctx.info.remoteAddr");
  } else if (last.getText() === "renderNotFound") {
    last.replaceWithText("throw");
    const caller = node.getParentIfKind(SyntaxKind.CallExpression);
    if (caller !== undefined) {
      caller.addArgument("404");
    }
  } else if (children[0].isKind(SyntaxKind.PropertyAccessExpression)) {
    rewriteCtxMemberName(children[0]);
  }
}
