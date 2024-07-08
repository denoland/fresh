import * as tsmorph from "ts-morph";
import { type ImportState, SyntaxKind } from "./update.ts";

export function maybePrependReqVar(
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
      if (body !== undefined && !body.isKind(SyntaxKind.Block)) {
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
      const objBinding = maybeObjBinding as tsmorph.ObjectBindingPattern;
      const bindings = objBinding.getElements();
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
