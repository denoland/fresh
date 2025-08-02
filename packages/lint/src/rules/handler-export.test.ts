import { expect } from "@std/expect";
import { testPlugin } from "../test-utils.ts";
import * as testRule from "./handler-export.ts";

const okCases = new Set<[filename: string, code: string]>([
  ["file:///foo.jsx", "const handler = {}"],
  ["file:///foo.jsx", "function handler() {}"],
  ["file:///foo.jsx", "export const handler = {}"],
  ["file:///foo.jsx", "export const handlers = {}"],
  ["file:///foo.jsx", "export function handlers() {}"],
  ["file:///routes/foo.jsx", "export const handler = {}"],
  ["file:///routes/foo.jsx", "export function handler() {}"],
  ["file:///routes/foo.jsx", "export async function handler() {}"],
  ["file:///routes/foo.jsx", "export const handler = define.handlers({});"],
  ["file:///C:/www/routes/foo.jsx", "export const handler = {}"],
]);

const errCases = new Set<[file: string, code: string, range: [number, number]]>(
  [
    ["file:///routes/index.tsx", "export const handlers = {}", [13, 21]],
    ["file:///routes/index.tsx", "export function handlers() {}", [16, 24]],
    ["file:///routes/index.tsx", "export async function handlers() {}", [
      22,
      30,
    ]],
    ["file:///C:/www/routes/foo.jsx", "export const handlers = {}", [13, 21]],
  ],
);

Deno.test("fresh/handler-export - ok", () => {
  for (const [file, code] of okCases) {
    const diagnostics = Deno.lint.runPlugin(testPlugin(testRule), file, code);

    expect(diagnostics.length).toBe(0);
  }
});

Deno.test("fresh/handler-export - err", () => {
  for (const [file, code, range] of errCases) {
    const [d, ...rest] = Deno.lint.runPlugin(testPlugin(testRule), file, code);

    expect(rest.length).toBe(0);
    expect(d.fix).toEqual([]);
    expect(d.range).toEqual(range);
    expect(d.id).toBe("fresh/handler-export");
    expect(d.message).toBe(
      'Fresh middlewares must be exported as "handler" but got "handlers" instead.',
    );
    expect(d.hint).toBe('Did you mean "handler"?');
  }
});
