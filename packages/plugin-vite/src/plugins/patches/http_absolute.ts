import type {
  NodePath,
  PluginObj,
  PluginPass,
  types,
  Visitor,
} from "@babel/core";

function maybeRewrite(
  t: typeof types,
  path: NodePath,
  source: string,
  url: URL,
) {
  if (source.startsWith("/")) {
    const s = `deno-http::${url.origin}${source}`;
    path.replaceWith(t.stringLiteral(s));
  } else if (/^https?:\/\//.test(source)) {
    const s = `deno-http::${source}`;
    path.replaceWith(t.stringLiteral(s));
  }
}

export function httpAbsolute(url: URL | null) {
  return ({ types: t }: { types: typeof types }): PluginObj => {
    const visitor: Visitor<PluginPass> = url !== null
      ? {
        ImportDeclaration(path) {
          const source = path.node.source.value;
          maybeRewrite(t, path.get("source"), source, url);
        },
        ExportAllDeclaration(path) {
          const source = path.node.source.value;
          maybeRewrite(t, path.get("source"), source, url);
        },
        ExportNamedDeclaration(path) {
          if (!path.node.source) return;

          const source = path.node.source.value;
          // deno-lint-ignore no-explicit-any
          maybeRewrite(t, path.get("source") as any, source, url);
        },
        CallExpression(path) {
          if (
            t.isImport(path.node.callee) && path.node.arguments.length > 0 &&
            t.isStringLiteral(path.node.arguments[0])
          ) {
            const source = path.node.arguments[0].value;
            maybeRewrite(
              t,
              path
                .get("arguments")[0],
              source,
              url,
            );
          }
        },
      }
      : {};

    return {
      name: "fresh-http-absolute",
      visitor,
    };
  };
}
