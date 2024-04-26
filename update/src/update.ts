import * as path from "@std/path";
import * as JSONC from "@std/jsonc";
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
  });

  // Update routes folder
  const routesDir = path.join(dir, "routes");
  try {
    await Deno.stat(routesDir);

    const project = new tsmorph.Project();
    const sfs = project.addSourceFilesAtPaths(
      path.join(routesDir, "**", "*.{js,jsx,ts,tsx}"),
    );
    await Promise.all(sfs.map((sourceFile) => {
      return updateFile(sourceFile);
    }));
  } catch (_) {
    // TODO
  }
}

async function updateFile(sourceFile: tsmorph.SourceFile): Promise<void> {
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
              maybePrependReqVar(property);

              const body = property.getBody();
              if (body !== undefined) {
                const stmts = body.getDescendantStatements();
                rewriteCtxMethods(stmts);
              }
            }
          }
        }
      } else if (tsmorph.Node.isFunctionDeclaration(decl[0])) {
        const d = decl[0];
        maybePrependReqVar(d);

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
          tsmorph.ts.SyntaxKind.ArrowFunction,
        );
        const body = init.getBody();
        if (body !== undefined) {
          const stmts = body.getDescendantStatements();
          rewriteCtxMethods(stmts);
        }
      }
    } else if (name === "default" && decl.length > 0) {
      const caller = decl[0];
      if (caller.isKind(tsmorph.ts.SyntaxKind.CallExpression)) {
        const id = decl[0].getFirstChildByKind(
          tsmorph.ts.SyntaxKind.Identifier,
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
                first.isKind(tsmorph.ts.SyntaxKind.ArrowFunction) ||
                first.isKind(tsmorph.ts.SyntaxKind.FunctionExpression)
              ) {
                maybePrependReqVar(first);
              }
            }
          }
        }
      }
    }
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
) {
  let hasRequestVar = false;
  const params = method.getParameters();
  if (params.length > 0) {
    const paramName = params[0].getName();

    hasRequestVar = params.length > 1 || paramName === "req";
    if (hasRequestVar || paramName === "_req") {
      params[0].remove();
    }

    if (hasRequestVar && !paramName.startsWith("_")) {
      method.insertVariableStatement(0, {
        declarationKind: tsmorph.VariableDeclarationKind.Const,
        declarations: [{
          name: paramName,
          initializer: "ctx.req",
        }],
      });
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

    if (stmt.isKind(tsmorph.ts.SyntaxKind.ReturnStatement)) {
      const expr = stmt.getChildAtIndex(1);
      if (expr) {
        rewriteCtxRenderNotFound(expr);
      }
    }
  }
}

function rewriteCtxRenderNotFound(node: tsmorph.Node<tsmorph.ts.Node>) {
  if (node.isKind(tsmorph.ts.SyntaxKind.CallExpression)) {
    const first = node.getFirstChild();
    if (
      !first || !first.isKind(tsmorph.ts.SyntaxKind.PropertyAccessExpression)
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
    children[0].isKind(tsmorph.ts.SyntaxKind.Identifier) &&
    children[1].isKind(tsmorph.ts.SyntaxKind.DotToken) &&
    children[2].isKind(tsmorph.ts.SyntaxKind.Identifier)
  ) {
    // deno-lint-ignore no-explicit-any
    return children as any;
  }

  return null;
}
