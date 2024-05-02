import * as path from "@std/path";
import * as JSONC from "@std/jsonc";
import * as tsmorph from "ts-morph";

const SyntaxKind = tsmorph.ts.SyntaxKind;

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

interface ImportState {
  core: Set<string>;
  runtime: Set<string>;
}

export async function updateProject(dir: string) {
  // Update config
  await updateDenoJson(dir, (config) => {
    if (config.imports !== null && typeof config.imports !== "object") {
      config.imports = {};
    }

    config.imports["@fresh/core"] = `jsr:@fresh/core@^${FRESH_VERSION}`;
    config.imports["preact"] = `npm:preact@^${PREACT_VERSION}`;
    config.imports["@preact/signals"] =
      `npm:@preact/signals@^${PREACT_SIGNALS_VERSION}`;
    delete config.imports["$fresh/"];
  });

  // Update routes folder
  const routesDir = path.join(dir, "routes");
  if (await dirExists(routesDir)) {
    const project = new tsmorph.Project();
    const sfs = project.addSourceFilesAtPaths(
      path.join(routesDir, "**", "*.{js,jsx,ts,tsx}"),
    );
    await Promise.all(sfs.map((sourceFile) => updateFile(sourceFile)));
  }
}

async function updateFile(sourceFile: tsmorph.SourceFile): Promise<void> {
  const newImports: ImportState = {
    core: new Set(),
    runtime: new Set(),
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

  for (const [name, decl] of sourceFile.getExportedDeclarations()) {
    if (name === "handler") {
      const maybeObjs = decl[0].getChildrenOfKind(
        SyntaxKind.ObjectLiteralExpression,
      );
      if (maybeObjs.length > 0) {
        const obj = maybeObjs[0];
        for (const property of obj.getProperties()) {
          if (property.isKind(SyntaxKind.MethodDeclaration)) {
            const name = property.getName();
            if (
              name === "GET" || name === "POST" || name === "PATCH" ||
              name === "PUT" || name === "DELETE"
            ) {
              maybePrependReqVar(property, newImports, true);

              const body = property.getBody();
              if (body !== undefined) {
                const stmts = body.getDescendantStatements();
                rewriteCtxMethods(stmts);
              }
            }
          } else if (property.isKind(SyntaxKind.PropertyAssignment)) {
            const init = property.getInitializer();
            if (
              init !== undefined &&
              (init.isKind(SyntaxKind.ArrowFunction) ||
                init.isKind(SyntaxKind.FunctionExpression))
            ) {
              maybePrependReqVar(init, newImports, true);

              const body = init.getBody();
              if (body !== undefined) {
                const stmts = body.getDescendantStatements();
                rewriteCtxMethods(stmts);
              }
            }
          }
        }
      } else if (tsmorph.Node.isFunctionDeclaration(decl[0])) {
        const d = decl[0];
        maybePrependReqVar(d, newImports, false);

        const body = d.getBody();
        if (body !== undefined) {
          const stmts = body.getDescendantStatements();
          rewriteCtxMethods(stmts);
        }
      } else if (
        tsmorph.Node.isVariableDeclaration(decl[0]) &&
        decl[0].getName() === "handler"
      ) {
        const init = decl[0].getChildAtIndex(2).asKindOrThrow(
          SyntaxKind.ArrowFunction,
        );
        const body = init.getBody();
        if (body !== undefined) {
          const stmts = body.getDescendantStatements();
          rewriteCtxMethods(stmts);
        }
      }
    } else if (name === "default" && decl.length > 0) {
      const caller = decl[0];
      if (caller.isKind(SyntaxKind.CallExpression)) {
        const id = decl[0].getFirstChildByKind(
          SyntaxKind.Identifier,
        );
        if (id !== undefined) {
          const text = id.getText();
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
                maybePrependReqVar(first, newImports, false);
              }
            }
          }
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
      d.setModuleSpecifier("@fresh/core");

      for (const n of d.getNamedImports()) {
        const name = n.getName();
        if (newImports.core.has(name)) {
          newImports.core.delete(name);
        }
      }
      if (newImports.core.size > 0) {
        newImports.core.forEach((name) => {
          d.addNamedImport(name);
        });
      }
    } else if (specifier === "$fresh/runtime.ts") {
      hasRuntimeImport = true;
      d.setModuleSpecifier("@fresh/core/runtime");

      for (const n of d.getNamedImports()) {
        const name = n.getName();
        if (newImports.runtime.has(name)) {
          newImports.runtime.delete(name);
        }
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
      moduleSpecifier: "@fresh/core",
      namedImports: Array.from(newImports.core),
    });
  }
  if (!hasRuntimeImport && newImports.runtime.size > 0) {
    sourceFile.addImportDeclaration({
      moduleSpecifier: "@fresh/core/runtime",
      namedImports: Array.from(newImports.core),
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

    hasRequestVar = params.length > 1 || paramName === "req";
    if (hasRequestVar || paramName === "_req") {
      if (hasRequestVar && params.length === 1) {
        params[0].replaceWithText("ctx");
        if (!hasInferredTypes && !method.isKind(SyntaxKind.MethodDeclaration)) {
          newImports.core.add("FreshContext");
          params[0].setType("FreshContext");
        }
      } else {
        params[0].remove();
      }
    }

    if (hasRequestVar && !paramName.startsWith("_")) {
      const firstChild = params.length > 1
        ? params[1].getFirstChildByKind(
          SyntaxKind.ObjectBindingPattern,
        )
        : undefined;
      if (firstChild === undefined) {
        const body = method.getBody();
        if (body !== undefined) {
          if (!body.isKind(SyntaxKind.Block)) {
            body.replaceWithText(`{ return ${body.getFullText()} }`);
          }
        }
        method.insertVariableStatement(0, {
          declarationKind: tsmorph.VariableDeclarationKind.Const,
          declarations: [{
            name: paramName,
            initializer: "ctx.req",
          }],
        });
      } else {
        const children = firstChild.getChildrenOfKind(SyntaxKind.SyntaxList);
        if (children.length > 0) {
          const list = children[0];
          list.replaceWithText(`${list.getFullText()}, req`);
        }
      }
    }
  }
}

function rewriteCtxMethods(
  stmts: (
    | tsmorph.Expression<tsmorph.ts.Expression>
    | tsmorph.Statement<tsmorph.ts.Statement>
  )[],
) {
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[0];

    if (stmt.isKind(SyntaxKind.ReturnStatement)) {
      const expr = stmt.getChildAtIndex(1);
      if (expr) {
        rewriteCtxRenderNotFound(expr);
      }
    }
  }
}

function rewriteCtxRenderNotFound(node: tsmorph.Node<tsmorph.ts.Node>) {
  if (node.isKind(SyntaxKind.CallExpression)) {
    const first = node.getFirstChild();
    if (
      !first || !first.isKind(SyntaxKind.PropertyAccessExpression)
    ) {
      return;
    }

    const children = toMemberExpr(first.getChildren());
    if (children !== null && children[2].getText() === "renderNotFound") {
      children[2].replaceWithText("throw");
      node.insertArgument(0, "404");
    }
  }
}

function toMemberExpr(
  children: tsmorph.Node<tsmorph.ts.Node>[],
): [tsmorph.Identifier, tsmorph.Node, tsmorph.Identifier] | null {
  if (
    children[0].isKind(SyntaxKind.Identifier) &&
    children[1].isKind(SyntaxKind.DotToken) &&
    children[2].isKind(SyntaxKind.Identifier)
  ) {
    // deno-lint-ignore no-explicit-any
    return children as any;
  }

  return null;
}

async function dirExists(dir: string): Promise<boolean> {
  try {
    return (await Deno.stat(dir)).isDirectory;
  } catch (_) {
    return false;
  }
}
