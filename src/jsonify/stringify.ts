import {
  INFINITY_NEG,
  INFINITY_POS,
  NAN,
  NULL,
  UNDEFINED,
  ZERO_NEG,
} from "./constants.ts";
import { HOLE } from "./constants.ts";

export type Stringifiers = Record<
  string,
  // deno-lint-ignore no-explicit-any
  (value: any) => { value: any } | undefined
>;

/**
 * Serializes the following:
 *
 * - `null`
 * - `undefined`
 * - `boolean`
 * - `number`
 * - `bigint`
 * - `string`
 * - `array`
 * - `object` (no prototypes)
 * - `Uint8Array`
 * - `URL`
 * - `Date`
 * - `RegExp`
 * - `Set`
 * - `Map`
 *
 * Circular references are supported and objects with the same reference are
 * serialized only once.
 */
export function stringify(data: unknown, custom?: Stringifiers): string {
  const out: string[] = [];
  const indexes = new Map<unknown, number>();
  const res = serializeInner(out, indexes, data, custom);
  if (res < 0) {
    return String(res);
  }
  return `[${out.join(",")}]`;
}

function serializeInner(
  out: string[],
  indexes: Map<unknown, number>,
  value: unknown,
  custom: Stringifiers | undefined,
): number {
  const seenIdx = indexes.get(value);
  if (seenIdx !== undefined) return seenIdx;

  if (value === undefined) return UNDEFINED;
  if (value === null) return NULL;
  if (Number.isNaN(value)) return NAN;
  if (value === Infinity) return INFINITY_POS;
  if (value === -Infinity) return INFINITY_NEG;
  if (value === 0 && 1 / value < 0) return ZERO_NEG;

  const idx = out.length;
  out.push("");
  indexes.set(value, idx);

  let str = "";

  if (typeof value === "number") {
    str += String(value);
  } else if (typeof value === "boolean") {
    str += String(value);
  } else if (typeof value === "bigint") {
    str += `["BigInt","${value}"]`;
  } else if (typeof value === "string") {
    str += JSON.stringify(value);
  } else if (Array.isArray(value)) {
    str += "[";
    for (let i = 0; i < value.length; i++) {
      if (i in value) {
        str += serializeInner(out, indexes, value[i], custom);
      } else {
        str += HOLE;
      }

      if (i < value.length - 1) {
        str += ",";
      }
    }
    str += "]";
  } else if (typeof value === "object") {
    if (custom !== undefined) {
      for (const k in custom) {
        const fn = custom[k];
        if (fn === undefined) continue;

        const res = fn(value);
        if (res === undefined) continue;

        const innerIdx = serializeInner(out, indexes, res.value, custom);
        str = `["${k}",${innerIdx}]`;
        out[idx] = str;
        return idx;
      }
    }

    if (value instanceof URL) {
      str += `["URL","${value.href}"]`;
    } else if (value instanceof Date) {
      str += `["Date","${value.toISOString()}"]`;
    } else if (value instanceof RegExp) {
      str += `["RegExp",${JSON.stringify(value.source)}, "${value.flags}"]`;
    } else if (value instanceof Uint8Array) {
      str += `["Uint8Array","${b64encode(value.buffer)}"]`;
    } else if (value instanceof Set) {
      const items = new Array(value.size);
      let i = 0;
      value.forEach((v) => {
        items[i++] = serializeInner(out, indexes, v, custom);
      });
      str += `["Set",[${items.join(",")}]]`;
    } else if (value instanceof Map) {
      const items = new Array(value.size * 2);
      let i = 0;
      value.forEach((v, k) => {
        items[i++] = serializeInner(out, indexes, k, custom);
        items[i++] = serializeInner(out, indexes, v, custom);
      });
      str += `["Map",[${items.join(",")}]]`;
    } else {
      str += "{";
      const keys = Object.keys(value);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        str += JSON.stringify(key) + ":";
        // deno-lint-ignore no-explicit-any
        str += serializeInner(out, indexes, (value as any)[key], custom);

        if (i < keys.length - 1) {
          str += ",";
        }
      }
      str += "}";
    }
  } else if (typeof value === "function") {
    throw new Error(`Serializing functions is not supported.`);
  }

  out[idx] = str;
  return idx;
}

// deno-fmt-ignore
const base64abc = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O",
  "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "a", "b", "c", "d",
  "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s",
  "t", "u", "v", "w", "x", "y", "z", "0", "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "+", "/",
];

/**
 * CREDIT: https://gist.github.com/enepomnyaschih/72c423f727d395eeaa09697058238727
 * Encodes a given Uint8Array, ArrayBuffer or string into RFC4648 base64 representation
 */
export function b64encode(buffer: ArrayBufferLike): string {
  const uint8 = new Uint8Array(buffer);
  let result = "",
    i;
  const l = uint8.length;
  for (i = 2; i < l; i += 3) {
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
    result += base64abc[((uint8[i - 1] & 0x0f) << 2) | (uint8[i] >> 6)];
    result += base64abc[uint8[i] & 0x3f];
  }
  if (i === l + 1) {
    // 1 octet yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[(uint8[i - 2] & 0x03) << 4];
    result += "==";
  }
  if (i === l) {
    // 2 octets yet to write
    result += base64abc[uint8[i - 2] >> 2];
    result += base64abc[((uint8[i - 2] & 0x03) << 4) | (uint8[i - 1] >> 4)];
    result += base64abc[(uint8[i - 1] & 0x0f) << 2];
    result += "=";
  }
  return result;
}
