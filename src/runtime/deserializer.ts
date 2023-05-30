// Run `deno run -A npm:esbuild --minify src/runtime/deserializer.ts` to minify
// this file. It is embedded into src/server/deserializer_code.ts.

export const KEY = "_f";

export function deserialize(str: string): unknown {
  function reviver(this: unknown, _key: string, value: unknown): unknown {
    if (typeof value === "object" && value && KEY in value) {
      // deno-lint-ignore no-explicit-any
      const v: any = value;
      if (v[KEY] === "l") {
        const val = v.v;
        val[KEY] = v.k;
        return val;
      }
      throw new Error(`Unknown key: ${v[KEY]}`);
    }
    return value;
  }

  const { v, r } = JSON.parse(str, reviver);
  const references = (r ?? []) as [string[], ...string[][]][];
  for (const [targetPath, ...refPaths] of references) {
    const target = targetPath.reduce((o, k) => k === null ? o : o[k], v);
    for (const refPath of refPaths) {
      if (refPath.length === 0) throw new Error("Invalid reference");
      // set the reference to the target object
      const parent = refPath.slice(0, -1).reduce(
        (o, k) => k === null ? o : o[k],
        v,
      );
      parent[refPath.at(-1)!] = target;
    }
  }
  return v;
}
