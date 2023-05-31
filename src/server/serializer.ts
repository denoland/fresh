/**
 * This module contains a serializer for island props. The serializer is capable
 * of serializing the following:
 *
 * - `null`
 * - `boolean`
 * - `number`
 * - `string`
 * - `array`
 * - `object` (no prototypes)
 *
 * Circular references are supported and objects with the same reference are
 * serialized only once.
 *
 * The corresponding deserializer is in `src/runtime/deserializer.ts`.
 */
import { KEY } from "../runtime/deserializer.ts";

interface SerializeResult {
  /** The string serialization. */
  serialized: string;
  /** If the deserializer is required to deserialize this string. If this is
   * `false` the serialized string can be deserialized with `JSON.parse`. */
  requiresDeserializer: boolean;
}

export function serialize(data: unknown): SerializeResult {
  let requiresDeserializer = false;
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

    // For some object types, the path in the object graph from root is not the
    // same between the serialized representation, and deserialized objects. For
    // these cases, we have to change the contents of the key stack to match the
    // deserialized object.
    if (typeof this === "object" && this !== null && KEY in this) {
      if (this[KEY] === "l" && key === "v") key = null;
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
      } else {
        seen.set(value, currentPath);
      }
    }

    if (typeof value === "object" && value && KEY in value) {
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
  return { serialized, requiresDeserializer };
}
