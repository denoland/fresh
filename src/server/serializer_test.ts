// deno-lint-ignore-file no-explicit-any

import { serialize } from "./serializer.ts";
import { assert, assertEquals, assertSnapshot } from "../../tests/deps.ts";
import { deserialize, KEY } from "../runtime/deserializer.ts";

Deno.test("serializer - primitives & plain objects", async (t) => {
  const data = {
    a: 1,
    b: "2",
    c: true,
    d: null,
    f: [1, 2, 3],
    g: { a: 1, b: 2, c: 3 },
  };
  const res = serialize(data);
  assert(!res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized = deserialize(res.serialized);
  assertEquals(deserialized, data);
});

Deno.test("serializer - magic key", async (t) => {
  const data = { [KEY]: "f", a: 1 };
  const res = serialize(data);
  assert(res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized = deserialize(res.serialized);
  assertEquals(deserialized, data);
});

Deno.test("serializer - circular reference objects", async (t) => {
  const data: any = { a: 1 };
  data.b = data;
  const res = serialize(data);
  assert(res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized = deserialize(res.serialized);
  assertEquals(deserialized, data);
});

Deno.test("serializer - circular reference nested objects", async (t) => {
  const data: any = { a: 1, b: { c: 2 } };
  data.b.d = data;
  const res = serialize(data);
  assert(res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized = deserialize(res.serialized);
  assertEquals(deserialized, data);
});

Deno.test("serializer - circular reference array", async (t) => {
  const data: any = [1, 2, 3];
  data.push(data);
  const res = serialize(data);
  assert(res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized: any = deserialize(res.serialized);
  assertEquals(deserialized, data);
  assertEquals(deserialized.length, 4);
});

Deno.test("serializer - multiple reference", async (t) => {
  const data: any = { a: 1, b: { c: 2 } };
  data.d = data.b;
  const res = serialize(data);
  assert(res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized = deserialize(res.serialized);
  assertEquals(deserialized, data);
});

Deno.test("serializer - multiple reference in magic key", async (t) => {
  const inner = { foo: "bar" };
  const literal: any = { [KEY]: "x", inner };
  const data = { literal, inner };
  const res = serialize(data);
  assert(res.requiresDeserializer);
  await assertSnapshot(t, res.serialized);
  const deserialized: any = deserialize(res.serialized);
  assertEquals(deserialized, data);
});
