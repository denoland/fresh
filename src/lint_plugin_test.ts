import { expect } from "@std/expect/expect";
import plugin from "./lint_plugin.ts";

Deno.test("fresh lint plugin - fresh/handler-export", async (t) => {
  const INVALID_CODE = `
export const handlers = {
  GET() {},
  POST() {},
};
export function handlers() {}
export async function handlers() {}
`;

  const VALID_CODE = `
export const handler = {
  GET() {},
  POST() {},
};
export function handler() {}
export async function handler() {}

// Doesn't apply
export class handlers {}
export const foo = {};
export function bar() {}
`;

  await t.step("ignores files not within a `/routes/` directory", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/not_routes/foo.ts",
      INVALID_CODE,
    );
    expect(diagnostics).toEqual([]);
  });

  await t.step("passes valid code in `/routes/` directory", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/routes/foo.ts",
      VALID_CODE,
    );
    expect(diagnostics).toEqual([]);
  });

  await t.step("fails invalid code in `/routes/` directory", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/routes/foo.ts",
      INVALID_CODE,
    );
    expect(diagnostics).toEqual([
      {
        hint: 'Did you mean "handler"?',
        message:
          `"Fresh middlewares must be exported as \`handler\` but got \`handlers\` instead."`,
        range: [1, 54],
        fix: [],
        id: "fresh/handler-export",
      },
      {
        hint: 'Did you mean "handler"?',
        message:
          `"Fresh middlewares must be exported as \`handler\` but got \`handlers\` instead."`,
        range: [55, 84],
        fix: [],
        id: "fresh/handler-export",
      },
      {
        hint: 'Did you mean "handler"?',
        message:
          `"Fresh middlewares must be exported as \`handler\` but got \`handlers\` instead."`,
        range: [85, 120],
        fix: [],
        id: "fresh/handler-export",
      },
    ]);
  });
});

Deno.test("fresh lint plugin - fresh/prefer-signals", async (t) => {
  const INVALID_CODE = `
import { useState } from "preact/hooks";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>{count}</button>
    </div>
  );
}
`;

  const VALID_CODE = `
import { useSignal } from "@preact/signals";

export default function App() {
  const count = useSignal(0);
  return (
    <div>
      <button onClick={() => (count.value += 1)}>{count}</button>
    </div>
  );
}
`;

  await t.step("passes invalid code in a `.tsx` file", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/islands/foo.tsx",
      VALID_CODE,
    );
    expect(diagnostics).toEqual([]);
  });

  await t.step("passes valid code in a `.jsx` file", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/islands/foo.jsx",
      VALID_CODE,
    );
    expect(diagnostics).toEqual([]);
  });

  await t.step("fails invalid code in a `.tsx` file", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/islands/foo.tsx",
      INVALID_CODE,
    );
    expect(diagnostics).toEqual([
      {
        hint:
          "Use `signal()` or `useSignal()` from `npm:@preact/signals` instead.",
        message:
          `Prefer to use \`signal()\` or \`useSignal()\` instead of \`useState()\` for state management.`,
        range: [103, 114],
        fix: [],
        id: "fresh/prefer-signals",
      },
    ]);
  });

  await t.step("fails invalid code in a route's island file", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/routes/foo/(_islands)/bar.tsx",
      INVALID_CODE,
    );
    expect(diagnostics).toEqual([
      {
        hint:
          "Use `signal()` or `useSignal()` from `npm:@preact/signals` instead.",
        message:
          `Prefer to use \`signal()\` or \`useSignal()\` instead of \`useState()\` for state management.`,
        range: [103, 114],
        fix: [],
        id: "fresh/prefer-signals",
      },
    ]);
  });

  await t.step("fails invalid code in a `.jsx` file", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/islands/foo.jsx",
      INVALID_CODE,
    );
    expect(diagnostics).toEqual([
      {
        hint:
          "Use `signal()` or `useSignal()` from `npm:@preact/signals` instead.",
        message:
          `Prefer to use \`signal()\` or \`useSignal()\` instead of \`useState()\` for state management.`,
        range: [103, 114],
        fix: [],
        id: "fresh/prefer-signals",
      },
    ]);
  });

  await t.step("passes invalid code in a non-island file", () => {
    const diagnostics = Deno.lint.runPlugin(
      plugin,
      "/foo.tsx",
      VALID_CODE,
    );
    expect(diagnostics).toEqual([]);
  });
});
