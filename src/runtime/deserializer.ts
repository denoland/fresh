// Run `deno run -A npm:esbuild --minify src/runtime/deserializer.ts` to minify
// this file. It is embedded into src/server/deserializer_code.ts.

export const KEY = "_f";

interface Signal<T> {
  peek(): T;
  value: T;
}

function b64decode(b64: string): Uint8Array {
  const binString = atob(b64);
  const size = binString.length;
  const bytes = new Uint8Array(size);
  for (let i = 0; i < size; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes;
}

export function deserialize(
  str: string,
  signal?: <T>(a: T) => Signal<T>,
): unknown {
  function reviver(this: unknown, _key: string, value: unknown): unknown {
    if (typeof value === "object" && value && KEY in value) {
      // deno-lint-ignore no-explicit-any
      const v: any = value;
      if (v[KEY] === "s") {
        return signal!(v.v);
      }
      if (v[KEY] === "b") {
        return BigInt(v.d);
      }
      if (v[KEY] === "u8a") {
        return b64decode(v.d);
      }
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
      parent[refPath[refPath.length - 1]!] = target;
    }
  }
  return v;
}
