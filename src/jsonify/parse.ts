import { decodeBase64 } from "@std/encoding/base64";
import {
  HOLE,
  INFINITY_NEG,
  INFINITY_POS,
  NAN,
  NULL,
  UNDEFINED,
  ZERO_NEG,
} from "./constants.ts";

// deno-lint-ignore no-explicit-any
export type CustomParser = Record<string, (value: any) => unknown>;

export function parse<T = unknown>(
  value: string,
  custom?: CustomParser | undefined,
): T {
  const data = JSON.parse(value);
  if (!Array.isArray(data)) return unpack([], [], data, custom) as T;
  const hydrated = new Array(data.length);
  unpack(data, hydrated, 0, custom);
  return hydrated[0];
}

function unpack(
  arr: unknown[],
  hydrated: unknown[],
  idx: number,
  custom: CustomParser | undefined,
): unknown {
  switch (idx) {
    case UNDEFINED:
      return undefined;
    case NULL:
      return null;
    case NAN:
      return NaN;
    case INFINITY_POS:
      return Infinity;
    case INFINITY_NEG:
      return -Infinity;
    case ZERO_NEG:
      return -0;
  }

  if (idx in hydrated) return hydrated[idx];

  const current = arr[idx];
  if (typeof current === "number") {
    return hydrated[idx] = current;
  } else if (
    typeof current === "string" || typeof current === "boolean" ||
    current === null
  ) {
    return hydrated[idx] = current;
  } else if (Array.isArray(current)) {
    if (current.length > 0 && typeof current[0] === "string") {
      const name = current[0];
      if (custom !== undefined && name in custom) {
        const fn = custom[name];
        const ref = current[1];
        const value = unpack(arr, hydrated, ref, custom);
        return hydrated[idx] = fn(value);
      }
      switch (name) {
        case "BigInt":
          return hydrated[idx] = BigInt(current[1]);
        case "Date":
          return hydrated[idx] = new Date(current[1]);
        case "RegExp":
          return hydrated[idx] = new RegExp(current[1], current[2]);
        case "Set": {
          const set = new Set();
          for (let i = 0; i < current[1].length; i++) {
            const ref = current[1][i];
            set.add(unpack(arr, hydrated, ref, custom));
          }
          return hydrated[idx] = set;
        }
        case "Map": {
          const set = new Map();
          for (let i = 0; i < current[1].length; i++) {
            const refKey = current[1][i++];
            const key = unpack(arr, hydrated, refKey, custom);
            const refValue = current[1][i];
            const value = unpack(arr, hydrated, refValue, custom);

            set.set(key, value);
          }
          return hydrated[idx] = set;
        }
        case "Uint8Array":
          // TODO(iuioiua): use `Uint8Array.prototype.fromBase64()` once
          // available (https://github.com/denoland/deno/issues/25051)
          return hydrated[idx] = decodeBase64(current[1]);
      }
    } else {
      const actual = new Array(current.length);
      hydrated[idx] = actual;
      for (let i = 0; i < current.length; i++) {
        const ref = current[i];
        if (ref === HOLE) {
          continue;
        } else {
          actual[i] = unpack(arr, hydrated, ref, custom);
        }
      }
      return actual;
    }
  } else if (typeof current === "object") {
    const actual: Record<string, unknown> = {};
    hydrated[idx] = actual;
    const keys = Object.keys(current);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      // deno-lint-ignore no-explicit-any
      const ref = (current as any)[key];
      actual[key] = unpack(arr, hydrated, ref, custom);
    }
    return actual;
  }
}
