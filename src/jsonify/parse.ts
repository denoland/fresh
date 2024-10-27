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

  const hydrated = new Array(data.length);
  // deno-lint-ignore no-explicit-any
  unpack(data, hydrated, 0, custom) as any;
  return hydrated[0];
}

function unpack(
  arr: unknown[],
  hydrated: unknown[],
  idx: number,
  custom: CustomParser | undefined,
): void {
  if (idx in hydrated) return;
  
  const current = arr[idx];
  if (typeof current === "number") {
    if(idx !== 0) {
      hydrated[idx] = current;
      return;
    }
    switch (current) {
      case UNDEFINED:
        hydrated[idx] = undefined;
        return;
      case NULL:
        hydrated[idx] = null;
        return;
      case NAN:
        hydrated[idx] = NaN;
        return;
      case INFINITY_POS:
        hydrated[idx] = Infinity;
        return;
      case INFINITY_NEG:
        hydrated[idx] = -Infinity;
        return;
      case ZERO_NEG:
        hydrated[idx] = -0;
        return;
      default:
        hydrated[idx] = current;
        return;
    }
  } else if (
    typeof current === "string" || typeof current === "boolean" ||
    current === null
  ) {
    hydrated[idx] = current;
    return;
  } else if (Array.isArray(current)) {
    if (current.length > 0 && typeof current[0] === "string") {
      const name = current[0];
      if (custom !== undefined && name in custom) {
        const fn = custom[name];
        const ref = current[1];
        unpack(arr, hydrated, ref, custom);
        const value = hydrated[ref];
        hydrated[idx] = fn(value);
        return;
      }
      switch (name) {
        case "BigInt":
          hydrated[idx] = BigInt(current[1]);
          return;
        case "Date":
          hydrated[idx] = new Date(current[1]);
          return;
        case "RegExp":
          hydrated[idx] = new RegExp(current[1], current[2]);
          return;
        case "Set": {
          const set = new Set();
          for (let i = 0; i < current[1].length; i++) {
            const ref = current[1][i];
            unpack(arr, hydrated, ref, custom);
            set.add(hydrated[ref]);
          }
          hydrated[idx] = set;
          return;
        }
        case "Map": {
          const set = new Map();
          for (let i = 0; i < current[1].length; i++) {
            const refKey = current[1][i++];
            unpack(arr, hydrated, refKey, custom);
            const refValue = current[1][i];
            unpack(arr, hydrated, refValue, custom);

            set.set(hydrated[refKey], hydrated[refValue]);
          }
          hydrated[idx] = set;
          return;
        }
        case "Uint8Array":
          hydrated[idx] = b64decode(current[1]);
          return;
      }
    } else {
      const actual = new Array(current.length);
      hydrated[idx] = actual;
      for (let i = 0; i < current.length; i++) {
        const ref = current[i];
        if (ref < 0) {
          switch (ref) {
            case UNDEFINED:
              actual[i] = undefined;
              break;
            case NULL:
              actual[i] = null;
              break;
            case NAN:
              actual[i] = NaN;
              break;
            case INFINITY_POS:
              actual[i] = Infinity;
              break;
            case INFINITY_NEG:
              actual[i] = -Infinity;
              break;
            case ZERO_NEG:
              actual[i] = -0;
              break;
            case HOLE:
              continue;
          }
        } else {
          unpack(arr, hydrated, ref, custom);
          actual[i] = hydrated[ref];
        }
      }
    }
  } else if (typeof current === "object") {
    const actual: Record<string, unknown> = {};
    hydrated[idx] = actual;

    const keys = Object.keys(current);
    for (const element of keys) {
      const key = element;
      // deno-lint-ignore no-explicit-any
      const ref = (current as any)[key];
      if (ref < 0) {
        switch (ref) {
          case UNDEFINED:
            actual[key] = undefined;
            break;
          case NULL:
            actual[key] = null;
            break;
          case NAN:
            actual[key] = NaN;
            break;
          case INFINITY_POS:
            actual[key] = Infinity;
            break;
          case INFINITY_NEG:
            actual[key] = -Infinity;
            break;
          case ZERO_NEG:
            actual[key] = -0;
            break;
        }
      } else {
        unpack(arr, hydrated, ref, custom);
        actual[key] = hydrated[ref];
      }
    }
  }
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
