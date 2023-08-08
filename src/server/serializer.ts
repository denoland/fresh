/**
 * This module contains a serializer for island props. The serializer is capable
 * of serializing the following:
 *
 * - `null`
 * - `boolean`
 * - `number`
 * - `bigint`
 * - `string`
 * - `array`
 * - `object` (no prototypes)
 * - `Uint8Array`
 * - `Signal` from `@preact/signals`
 *
 * Circular references are supported and objects with the same reference are
 * serialized only once.
 *
 * The corresponding deserializer is in `src/runtime/deserializer.ts`.
 */
import { isValidElement, VNode } from "preact";
import { KEY } from "../runtime/deserializer.ts";

interface SerializeResult {
  /** The string serialization. */
  serialized: string;
  /** If the deserializer is required to deserialize this string. If this is
   * `false` the serialized string can be deserialized with `JSON.parse`. */
  requiresDeserializer: boolean;
  /** If the serialization contains serialized signals. If this is `true` the
   * deserializer must be passed a factory functions for signals. */
  hasSignals: boolean;
}

interface Signal {
  peek(): unknown;
  value: unknown;
}

// deno-lint-ignore no-explicit-any
function isSignal(x: any): x is Signal {
  return (
    x !== null &&
    typeof x === "object" &&
    typeof x.peek === "function" &&
    "value" in x
  );
}

// deno-lint-ignore no-explicit-any
function isVNode(x: any): x is VNode {
  return x !== null && typeof x === "object" && "type" in x && "ref" in x &&
    "__k" in x &&
    isValidElement(x);
}

export function serialize(data: unknown): SerializeResult {
  let requiresDeserializer = false;
  let hasSignals = false;
  const seen = new Map<unknown, (string | null)[]>();
  const references = new Map<(string | null)[], (string | null)[][]>();

  const keyStack: (string | null)[] = [];
  const parentStack: unknown[] = [];

  let earlyReturn = false;

  const toSerialize = {
    v: data,
    get r() {
      earlyReturn = true;
      if (references.size > 0) {
        const refs = [];
        for (const [targetPath, refPaths] of references) {
          refs.push([targetPath, ...refPaths]);
        }
        return refs;
      }
      return undefined;
    },
  };

  function replacer(
    this: unknown,
    key: string | null,
    value: unknown,
  ): unknown {
    if (value === toSerialize || earlyReturn) {
      return value;
    }

    // Bypass signal's `.toJSON` method because we want to serialize
    // the signal itself including the signal's value and not just
    // the value. This is needed because `JSON.stringify` always
    // calls `.toJSON` automatically if available.
    // deno-lint-ignore no-explicit-any
    if (key !== null && isSignal((this as any)[key])) {
      // deno-lint-ignore no-explicit-any
      value = (this as any)[key];
    }

    // For some object types, the path in the object graph from root is not the
    // same between the serialized representation, and deserialized objects. For
    // these cases, we have to change the contents of the key stack to match the
    // deserialized object.
    if (typeof this === "object" && this !== null && KEY in this) {
      if (this[KEY] === "s" && key === "v") key = "value"; // signals
      if (this[KEY] === "l" && key === "v") key = null; // literals (magic key object)
    }

    if (this !== toSerialize) {
      const parentIndex = parentStack.indexOf(this);
      parentStack.splice(parentIndex + 1);
      keyStack.splice(parentIndex);
      keyStack.push(key);
      // the parent is pushed before return
    }

    if (typeof value === "object" && value !== null) {
      const path = seen.get(value);
      const currentPath = [...keyStack];
      if (path !== undefined) {
        requiresDeserializer = true;
        const referenceArr = references.get(path);
        if (referenceArr === undefined) {
          references.set(path, [currentPath]);
        } else {
          referenceArr.push(currentPath);
        }
        return 0;
      } else if (isVNode(value)) {
        requiresDeserializer = true;
        // No need to serialize JSX as we pick that up from
        // the rendered HTML in the browser.
        const res = null;
        parentStack.push(res);
        return res;
      } else {
        seen.set(value, currentPath);
      }
    }

    if (isSignal(value)) {
      requiresDeserializer = true;
      hasSignals = true;
      const res = { [KEY]: "s", v: value.peek() };
      parentStack.push(res);
      return res;
    } else if (typeof value === "bigint") {
      requiresDeserializer = true;
      const res = { [KEY]: "b", d: value.toString() };
      parentStack.push(res);
      return res;
    } else if (value instanceof Uint8Array) {
      requiresDeserializer = true;
      const res = { [KEY]: "u8a", d: b64encode(value) };
      parentStack.push(res);
      return res;
    } else if (typeof value === "object" && value && KEY in value) {
      requiresDeserializer = true;
      // deno-lint-ignore no-explicit-any
      const v: any = { ...value };
      const k = v[KEY];
      delete v[KEY];
      const res = { [KEY]: "l", k, v };
      parentStack.push(res);
      return res;
    } else {
      parentStack.push(value);
      return value;
    }
  }

  const serialized = JSON.stringify(toSerialize, replacer);
  return { serialized, requiresDeserializer, hasSignals };
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
export function b64encode(buffer: ArrayBuffer): string {
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
