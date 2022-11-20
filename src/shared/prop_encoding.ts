import {
  decode,
  encode,
} from "https://deno.land/std@0.150.0/encoding/base64.ts";
import CRC32 from "https://esm.sh/crc-32@1.2.2";

function replaceValues<T>(
  obj: Record<PropertyKey, unknown>,
  fn: (value: unknown) => NonNullable<T> | undefined,
) {
  const handleValue = (val: unknown): unknown => {
    if (Array.isArray(val)) {
      return val.map((val) => handleValue(val));
    }
    const newVal = fn(val);
    if (newVal !== undefined) {
      return newVal;
    }
    if (val && typeof val === "object") {
      return handleObj({ ...val });
    }
    return val;
  };

  const handleObj = (obj: Record<PropertyKey, unknown>) =>
    Object.fromEntries(
      Object.entries(obj).map(([key, val]) => [key, handleValue(val)]),
    );

  return handleObj(obj);
}

function toHexByte(n: number) {
  const s = n.toString(16).padStart(2, "0");
  if (s.length > 2) {
    throw new Error("Byte must be in range [0-255]");
  }
  return s;
}

const PREFIX = `__FRSH_`;

enum EncodedType {
  UNKNOWN = 0,
  UINT8ARRAY = 1,
  MAX = 256,
}

const pack = (type: EncodedType, data: string): string =>
  PREFIX + toHexByte(type) + data;

const unpack = (val: unknown): [EncodedType, string] => {
  if (typeof val !== "string" || !val.startsWith(PREFIX)) {
    return [EncodedType.UNKNOWN, ""];
  }
  const s = val.substring(PREFIX.length);
  return [parseInt(s.slice(0, 2), 16), s.slice(2)];
};

export type EncodedState = {
  props: Record<PropertyKey, unknown>;
  crcs: number[];
};

export function encodeProps(props: Record<PropertyKey, unknown>): EncodedState {
  const crcs: EncodedState["crcs"] = [];
  return {
    props: replaceValues(props, (val) => {
      if (val instanceof Uint8Array) {
        crcs.push(CRC32.buf(val));
        return pack(EncodedType.UINT8ARRAY, encode(val));
      }
    }),
    crcs,
  };
}

export function decodeProps({ props, crcs }: EncodedState) {
  const check = (val: Uint8Array) =>
    crcs.includes(CRC32.buf(val)) ? val : undefined;

  return replaceValues(props, (val) => {
    const [type, data] = unpack(val);

    switch (type) {
      case EncodedType.UNKNOWN:
        return undefined;
      case EncodedType.UINT8ARRAY:
        return check(decode(data));
      default:
        throw new Error(`Unknown type "${type}"`);
    }
  });
}
