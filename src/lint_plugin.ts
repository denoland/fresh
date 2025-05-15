function isComponentFile(path: string) {
  return path.endsWith(".tsx") || path.endsWith(".jsx");
}

function isIslandFile(path: string) {
  return path.includes("/islands/") ||
    (path.includes("/routes/") && path.includes("/(_islands)/"));
}

/**
 * Fresh lint plugin
 *
 * ## `fresh/handler-export`
 *
 * Checks correct naming for named Fresh middleware export. Files inside the
 * `/routes/` folder can export middlewares that run before any rendering
 * happens. They are expected to be available as a named export called handler.
 * This rule checks for when the export was incorrectly named handlers instead
 * of handler.
 *
 * @example Invalid
 * ```ts
 * // routes/index.tsx
 * export const handlers = {
 *   GET() {},
 *   POST() {},
 * };
 * export function handlers() {}
 * export async function handlers() {}
 * ```
 *
 * @example Valid
 * ```ts
 * // routes/index.tsx
 * export const handler = {
 *   GET() {},
 *   POST() {},
 * };
 * export function handler() {}
 * export async function handler() {}
 * ```
 *
 * ## `fresh/prefer-signals`
 *
 * Checks for the use of `useState()` from React. Fresh uses Preact and
 * {@linkcode https://www.npmjs.com/package/@preact/signals | @preact/signals}
 * for state management. This rule checks for the use of
 * `useState()` and suggests using `signal()` or `useSignal()` instead. Signals
 * are a more efficient and ergonomic way to manage state in Preact applications.
 * For more information, see
 * {@link https://preactjs.com/blog/introducing-signals/}
 *
 * @example Invalid
 * ```tsx
 * // islands/my-island.tsx
 * import { useState } from "preact/hooks";
 *
 * export default function MyIsland() {
 *   const [count, setCount] = useState(0);
 *
 * return (
 *   <div>
 *     Counter is at {count}.{" "}
 *     <button onClick={() => setCount(count + 1)}>+</button>
 *   </div>
 *  );
 * }
 * ```
 *
 * @example Valid
 * ```tsx
 * // islands/my-island.tsx
 * import { useSignal } from "@preact/signals";
 *
 * export default function MyIsland() {
 *   const count = useSignal(0);
 *
 * return (
 *   <div>
 *     Counter is at {count}.{" "}
 *     <button onClick={() => (count.value += 1)}>+</button>
 *   </div>
 *  );
 * }
 * ```
 */
export default {
  name: "fresh",
  rules: {
    "handler-export": {
      create(context) {
        return {
          ExportNamedDeclaration(node) {
            if (
              /**
               * Fresh only considers components in the `/routes/` folder to be
               * server components.
               */
              !context.filename.includes("/routes/") ||
              node.exportKind !== "value"
            ) return;
            let id: Deno.lint.Identifier;
            if (
              node.declaration?.type === "FunctionDeclaration" &&
              node.declaration.id?.type === "Identifier"
            ) {
              id = node.declaration.id;
            } else if (
              node.declaration?.type === "VariableDeclaration" &&
              node.declaration.declarations?.[0].id.type === "Identifier"
            ) {
              id = node.declaration.declarations[0].id;
            } else {
              return;
            }
            if (id.name === "handlers") {
              // TODO(iuioiua): add fix
              context.report({
                node,
                range: id.range,
                hint: 'Did you mean "handler"?',
                message:
                  `"Fresh middlewares must be exported as \`handler\` but got \`handlers\` instead."`,
              });
            }
          },
        };
      },
    },
    "prefer-signals": {
      create(context) {
        return {
          CallExpression(node) {
            if (
              !isComponentFile(context.filename) &&
              !isIslandFile(context.filename)
            ) {
              return;
            }
            if (
              node.callee.type === "Identifier" &&
              node.callee.name === "useState"
            ) {
              // TODO(iuioiua): add fix
              context.report({
                node,
                range: node.range,
                hint:
                  "Use `signal()` or `useSignal()` from `npm:@preact/signals` instead.",
                message:
                  "Prefer to use `signal()` or `useSignal()` instead of `useState()` for state management.",
              });
            }
          },
        };
      },
    },
  },
} as Deno.lint.Plugin;
