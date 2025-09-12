import { expect } from "@std/expect";
import { testPlugin } from "../test-utils.ts";
import * as testRule from "./server-event-handlers.ts";

const okCases = new Set<[filename: string, code: string]>([
  ["file:///foo.jsx", "<Foo onClick={() => {}} />"],
  ["file:///foo.jsx", "<button onClick={() => {}} />"],
  ["file:///foo.jsx", "<button onClick={function () {}} />"],
  ["file:///foo.jsx", "<button onclick={function () {}} />"],
  ["file:///foo.jsx", "<button onClick=\"console.log('hey')\" />"],
  ["file:///foo.jsx", '<button online="foo" />'],
  ["file:///foo.jsx", "<x-foo onClick=\"console.log('hey')\" />"],
  [
    "file:///routes/foo/(_islands)/foo.jsx",
    "<button onClick={function () {}} />",
  ],
]);

const errCases = new Set<[file: string, code: string, range: [number, number]]>(
  [
    ["file:///routes/index.tsx", "<button onClick={() => {}} />", [8, 26]],
    ["file:///routes/index.tsx", "<button onTouchMove={() => {}} />", [8, 30]],
    [
      "file:///routes/index.tsx",
      `<button onTouchMove={"console.log('hey')"} />`,
      [8, 42],
    ],
    ["file:///routes/index.tsx", "<foo-button foo={() => {}} />", [12, 26]],
    ["file:///routes/index.tsx", "<foo-button foo={function () {}} />", [
      12,
      32,
    ]],
  ],
);

Deno.test("fresh/server-event-handlers - ok", () => {
  for (const [file, code] of okCases) {
    const diagnostics = Deno.lint.runPlugin(testPlugin(testRule), file, code);

    expect(diagnostics.length).toBe(0);
  }
});

Deno.test("fresh/server-event-handlers - err", () => {
  for (const [file, code, range] of errCases) {
    const [d, ...rest] = Deno.lint.runPlugin(testPlugin(testRule), file, code);

    expect(rest.length).toBe(0);
    expect(d.fix).toEqual([]);
    expect(d.range).toEqual(range);
    expect(d.id).toBe("fresh/server-event-handlers");
    expect(d.message).toBe(
      "Server components cannot install client side event handlers.",
    );
    expect(d.hint).toBe(
      "Remove this property or turn the enclosing component into an island",
    );
  }
});
