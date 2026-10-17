import { test } from "vitest";
import assert from "node:assert/strict";

import { computed, signal } from "@preact/signals";

import {
  buildImportLines,
  createSerializer,
  SIGNAL_HELPER_EXPORT,
  SIGNAL_HELPER_SPECIFIER,
} from "./serialization.ts";
import { navigating } from "../runtime/navigation.ts";

/**
 * The factories in `client/builtin-signals.ts` only stamp their
 * `__FRESH_SERIALIZABLE_FUNCTION` marker under `import.meta.env.SSR` — so
 * in a Node test runtime (where that flag is undefined) the markers
 * aren't set. Re-stamp them here to simulate the SSR build environment.
 */
async function loadBuiltinsForSsr(): Promise<typeof import("../client/builtin-signals.ts")> {
  const m = await import("../client/builtin-signals.ts");
  const SPEC = "fresh/signals";
  for (const name of ["equals", "test", "and", "or", "not"] as const) {
    const fn = m[name] as unknown as { __FRESH_SERIALIZABLE_FUNCTION?: unknown };
    if (fn.__FRESH_SERIALIZABLE_FUNCTION === undefined) {
      fn.__FRESH_SERIALIZABLE_FUNCTION = { specifier: SPEC, export: name };
    }
  }
  return m;
}

/**
 * Tag a function as a SerializableFunction the same way the island
 * transform / framework-shipped factories do.
 */
function tagIslandExport<T extends (...args: never[]) => unknown>(
  fn: T,
  specifier: string,
  exportName: string | null,
): T {
  (fn as unknown as { __FRESH_SERIALIZABLE_FUNCTION: unknown }).__FRESH_SERIALIZABLE_FUNCTION = {
    specifier,
    export: exportName,
  };
  return fn;
}

/**
 * Eval a serialized data expression. Each import alias is bound to a
 * call-recording sentinel that returns a fresh `{__call:…}` record
 * capturing `(specifier, export, args)` — useful for asserting on the
 * eval'd shape without booting Preact.
 */
function evalProgram(
  dataSrc: string,
  imports: Map<string, { index: number; imports: Map<string | null, number> }>,
): unknown {
  const lines: string[] = [];
  for (const [specifier, entry] of imports) {
    for (const [exportName, idx] of entry.imports) {
      const alias = `_${entry.index}_${idx}`;
      lines.push(
        `const ${alias} = (...args) => ({ __call: { specifier: ${JSON.stringify(
          specifier,
        )}, export: ${JSON.stringify(exportName)}, args } });`,
      );
    }
  }
  const body = `${lines.join("\n")}\nreturn ${dataSrc};`;
  return new Function(body)();
}

// ---------- Bare signal ----------

test("a bare signal becomes a `<signalAlias>(<value>)` call expression and registers SIGNAL_HELPER", () => {
  const ser = createSerializer();
  const src = ser.serialize(signal(42));
  // Just the call expression — no shared-decl indirection.
  assert.match(src, /^_\d+_\d+\(42\)$/);
  // SIGNAL_HELPER_SPECIFIER registered with SIGNAL_HELPER_EXPORT.
  const entry = ser.imports.get(SIGNAL_HELPER_SPECIFIER);
  assert.ok(entry, "SIGNAL_HELPER_SPECIFIER must be registered");
  assert.equal(entry.imports.get(SIGNAL_HELPER_EXPORT), 0);
});

test("a signal referenced twice survives as one shared instance via devalue's IIFE-bound local", () => {
  const ser = createSerializer();
  const s = signal("hello");
  const src = ser.serialize({ a: s, b: s });
  // Eval with sentinels — both positions must reference the same call
  // record (= same JS object). devalue handles this via the IIFE
  // pattern around our replacer-returned string.
  const built = evalProgram(src, ser.imports) as { a: unknown; b: unknown };
  assert.equal(built.a, built.b, "shared signal must round-trip to a single object");
});

test("plain `computed()` signals (no factory marker) throw at serialize time", () => {
  const ser = createSerializer();
  const s = signal(2);
  const c = computed(() => s.value * 21);
  assert.throws(() => ser.serialize({ c }), /Cannot serialize a computed signal/);
});

// ---------- SerializableFunction ----------

test("a bare island-exported function becomes the alias `_<m>_<s>` directly", () => {
  const ser = createSerializer();
  const fn = tagIslandExport(() => null, "islands/Counter.tsx", "Counter");
  const src = ser.serialize(fn);
  // Module-index 0, export-index 0 → `_0_0`.
  assert.equal(src, "_0_0");
  const entry = ser.imports.get("islands/Counter.tsx");
  assert.ok(entry);
  assert.equal(entry.index, 0);
  assert.equal(entry.imports.get("Counter"), 0);
});

test("multiple exports from the same module share a module index but get distinct export indices", () => {
  const ser = createSerializer();
  const a = tagIslandExport(() => null, "islands/utils.tsx", "fa");
  const b = tagIslandExport(() => null, "islands/utils.tsx", "fb");
  ser.serialize([a, b]);
  const entry = ser.imports.get("islands/utils.tsx");
  assert.ok(entry);
  assert.equal(entry.index, 0);
  assert.equal(entry.imports.get("fa"), 0);
  assert.equal(entry.imports.get("fb"), 1);
});

test("exports from different modules get monotonic module indices in insertion order", () => {
  const ser = createSerializer();
  const a = tagIslandExport(() => null, "islands/A.tsx", "x");
  const b = tagIslandExport(() => null, "islands/B.tsx", "y");
  const src = ser.serialize([a, b]);
  assert.match(src, /\[_0_0,_1_0\]/);
  assert.equal(ser.imports.get("islands/A.tsx")?.index, 0);
  assert.equal(ser.imports.get("islands/B.tsx")?.index, 1);
});

test("the SAME exported function used twice gets ONE entry in the imports map", () => {
  const ser = createSerializer();
  const fn = tagIslandExport(() => null, "islands/utils.tsx", "fa");
  ser.serialize({ a: fn, b: fn });
  const entry = ser.imports.get("islands/utils.tsx")!;
  assert.equal(entry.imports.size, 1);
});

test("a `null` export name is recorded under the default-export slot", () => {
  const ser = createSerializer();
  const fn = tagIslandExport(() => null, "islands/Default.tsx", null);
  ser.serialize(fn);
  const entry = ser.imports.get("islands/Default.tsx")!;
  assert.equal(entry.imports.get(null), 0);
});

// ---------- FactoryFunction ----------

test("a factory-wrapped value becomes a `(<factoryAlias>)(<args>)` call expression inline", () => {
  const ser = createSerializer();
  const factory = tagIslandExport((b: number) => b * 2, "islands/utils.tsx", "doubled");
  // Any object carrying `__FRESH_FROM_FACTORY` IS the factory result —
  // the whole value collapses to the call expression.
  const result = { __FRESH_FROM_FACTORY: { factory, args: [21] } };
  const src = ser.serialize(result);
  assert.equal(src, "(_0_0)(21)");
});

test("a factory whose wrapper isn't a SerializableFunction throws a clear error", () => {
  const ser = createSerializer();
  const result = {
    __FRESH_FROM_FACTORY: { factory: () => 0, args: [] },
  };
  assert.throws(() => ser.serialize(result), /factory\(\.\.\.\) wrapper isn't/);
});

test("factory args are recursively walked through the replacer — signals inside args become live signal calls", () => {
  const ser = createSerializer();
  const factory = tagIslandExport((s: unknown) => ({ derived: s }), "islands/utils.tsx", "wrap");
  const sig = signal(7);
  const result = { __FRESH_FROM_FACTORY: { factory, args: [sig] } };
  // Serialize the factory result on its own. (Sharing `sig` with a
  // sibling position would push devalue into its IIFE-dedup form, which is
  // a different shape than what this test is asserting about.)
  const src = ser.serialize(result);
  // The arg is itself a signal-call expression — proving the args
  // went back through the replacer rather than being inlined as a
  // plain `Signal` object literal.
  assert.match(src, /^\(_0_0\)\(_\d+_\d+\(7\)\)$/);
  // Sanity-check via eval: arg[0] is a `signal(7)` call record.
  const built = evalProgram(src, ser.imports) as {
    __call: { args: Array<{ __call: { export: string; args: unknown[] } }> };
  };
  assert.equal(built.__call.args[0].__call.export, SIGNAL_HELPER_EXPORT);
  assert.deepEqual(built.__call.args[0].__call.args, [7]);
});

test("the SAME factory-result reference used twice survives as one instance via devalue's IIFE-bound local", () => {
  // The simpler dedup case — two references to the same factory
  // result. devalue notices the same JS object and IIFE-wraps the
  // shared expression.
  const ser = createSerializer();
  const factory = tagIslandExport(
    (n: number) => ({ doubled: n * 2 }),
    "islands/utils.tsx",
    "doubled",
  );
  const result = { __FRESH_FROM_FACTORY: { factory, args: [21] } };
  const src = ser.serialize({ a: result, b: result });
  const built = evalProgram(src, ser.imports) as { a: unknown; b: unknown };
  assert.equal(built.a, built.b);
});

test("a signal inside a factory's args AND in a sibling position survives as one shared instance", () => {
  const ser = createSerializer();
  const factory = tagIslandExport((s: unknown) => ({ derived: s }), "islands/utils.tsx", "wrap");
  const sig = signal(7);
  const src = ser.serialize({ a: { __FRESH_FROM_FACTORY: { factory, args: [sig] } }, b: sig });
  const built = evalProgram(src, ser.imports) as { a: { __call: { args: unknown[] } }; b: unknown };
  assert.equal(built.a.__call.args[0], built.b);
});

// ---------- aliasFor (post-hoc imports, e.g. the boot runtime) ----------

test("aliasFor can register an additional import after serialize() — gets the next module index", () => {
  const ser = createSerializer();
  ser.serialize(tagIslandExport(() => null, "islands/A.tsx", "A"));
  const bootAlias = ser.aliasFor(SIGNAL_HELPER_SPECIFIER, "boot");
  assert.equal(bootAlias, "_1_0");
});

test("aliasFor re-registering the same (specifier, export) returns the same alias", () => {
  const ser = createSerializer();
  const a = ser.aliasFor("foo", "bar");
  const b = ser.aliasFor("foo", "bar");
  assert.equal(a, b);
});

// ---------- buildImportLines ----------

test('buildImportLines emits `import { name as _<m>_<s>, … } from "<url>";` per module', () => {
  const ser = createSerializer();
  ser.aliasFor("specA", "x");
  ser.aliasFor("specA", "y");
  ser.aliasFor("specB", null);
  const urls = new Map([
    ["specA", "/assets/A.js"],
    ["specB", "/assets/B.js"],
  ]);
  const lines = buildImportLines(ser.imports, (s) => urls.get(s)!);
  assert.deepEqual(lines, [
    `import {x as _0_0,y as _0_1} from "/assets/A.js";`,
    `import {default as _1_0} from "/assets/B.js";`,
  ]);
});

// ---------- end-to-end with framework-shipped built-ins ----------

test('end-to-end: `equals(role, "admin")` rides FactoryFunction → SerializableFunction via fresh/signals', async () => {
  const builtinSignals = await loadBuiltinsForSsr();
  const role = signal("guest");
  const isAdmin = builtinSignals.equals(role, "admin");
  const ser = createSerializer();
  const src = ser.serialize(isAdmin);
  // The whole expression is `(equalsAlias)(signalAlias("guest"),"admin")`.
  assert.match(src, /\(_\d+_\d+\)\(_\d+_\d+\("guest"\),"admin"\)/);
  // fresh/signals must be in the imports map under `equals`.
  const freshSignals = ser.imports.get("fresh/signals");
  assert.ok(freshSignals);
  assert.ok(freshSignals.imports.has("equals"));
  // SIGNAL_HELPER_SPECIFIER is in too (for the role signal).
  assert.ok(ser.imports.has(SIGNAL_HELPER_SPECIFIER));
});

test("`navigating()` serializes as a factory call via fresh/signals (not a bare computed)", () => {
  // `navigating` only stamps its marker under `import.meta.env.SSR`; re-stamp
  // it for the Node test runtime (same as the built-ins above).
  const nav = navigating as unknown as { __FRESH_SERIALIZABLE_FUNCTION?: unknown };
  if (nav.__FRESH_SERIALIZABLE_FUNCTION === undefined) {
    nav.__FRESH_SERIALIZABLE_FUNCTION = { specifier: "fresh/signals", export: "navigating" };
  }
  const ser = createSerializer();
  // The whole value collapses to a `(factoryAlias)()` call — proving it rides
  // the FactoryFunction path instead of throwing "Cannot serialize a computed
  // signal" the way a bare `computed()` does.
  const src = ser.serialize(navigating());
  assert.match(src, /^\(_\d+_\d+\)\(\)$/);
  const entry = ser.imports.get("fresh/signals");
  assert.ok(entry, "fresh/signals must be registered");
  assert.ok(entry.imports.has("navigating"));
});

// ---------- wire-format round-trips for built-in value types ----------

/** Serialize `value` and eval the emitted expression back into a value. */
function roundTrip<T>(value: T): T {
  const ser = createSerializer();
  const src = ser.serialize(value);
  return evalProgram(src, ser.imports) as T;
}

test("`undefined`, `NaN`, `±Infinity`, and `-0` round-trip, including nested in objects and arrays", () => {
  for (const v of [undefined, NaN, Infinity, -Infinity, -0]) {
    assert.ok(Object.is(roundTrip(v), v), `${String(v)} must round-trip`);
  }
  const out = roundTrip({ u: undefined, n: NaN, arr: [Infinity, -Infinity, -0, undefined] });
  assert.ok("u" in out, "an `undefined`-valued key must survive, not be dropped");
  assert.equal(out.u, undefined);
  assert.ok(Number.isNaN(out.n));
  assert.equal(out.arr.length, 4);
  assert.equal(out.arr[0], Infinity);
  assert.equal(out.arr[1], -Infinity);
  assert.ok(Object.is(out.arr[2], -0));
  assert.ok(3 in out.arr, "an explicit `undefined` element is not a hole");
});

/** An array of `length` holes with only `entries` populated. */
function sparse(length: number, entries: Record<number, unknown>): unknown[] {
  const arr: unknown[] = [];
  arr.length = length;
  return Object.assign(arr, entries);
}

test("sparse arrays keep their holes and length", () => {
  // Mildly sparse (devalue emits `[1,,3]`), very sparse (emitted as
  // `Object.assign(Array(n),{…})`), and a trailing hole (needs an extra `,`).
  const cases = [
    sparse(3, { 0: 1, 2: 3 }),
    sparse(1000, { 3: "a", 997: "b" }),
    sparse(3, { 0: 1, 1: 2 }),
  ];
  for (const arr of cases) {
    const out = roundTrip(arr);
    assert.equal(out.length, arr.length);
    for (let i = 0; i < arr.length; i++) {
      assert.equal(i in out, i in arr, `index ${i} hole-ness must match`);
      assert.equal(out[i], arr[i]);
    }
  }
});

test("`URL` and `URLSearchParams` revive as instances", () => {
  const out = roundTrip({
    url: new URL("https://example.com/a?b=1#c"),
    params: new URLSearchParams("x=1&x=2&y=</script>"),
  });
  assert.ok(out.url instanceof URL);
  assert.equal(out.url.href, "https://example.com/a?b=1#c");
  assert.ok(out.params instanceof URLSearchParams);
  assert.deepEqual(out.params.getAll("x"), ["1", "2"]);
  assert.equal(out.params.get("y"), "</script>");
});

test("`ArrayBuffer`, `Uint8Array`, and every other typed array revive with their type and contents", () => {
  const values = [
    new Int8Array([-128, 0, 127]),
    new Uint8Array([0, 1, 255]),
    new Uint8ClampedArray([0, 128, 255]),
    new Int16Array([-32768, 32767]),
    new Uint16Array([0, 65535]),
    new Float16Array([1.5, -2]),
    new Int32Array([-1, 2 ** 31 - 1]),
    new Uint32Array([0, 2 ** 32 - 1]),
    new Float32Array([0.5, -Infinity]),
    new Float64Array([Math.PI, NaN, -0]),
    new BigInt64Array([-(2n ** 63n), 1n]),
    new BigUint64Array([2n ** 64n - 1n]),
  ];
  for (const v of values) {
    const out = roundTrip(v);
    assert.equal(out.constructor, v.constructor);
    assert.deepEqual(out, v);
  }
  // A typed array referenced twice goes through devalue's hoisted-value path,
  // which writes its elements separately from the inline path.
  const big = new BigInt64Array([-(2n ** 63n), 1n]);
  const shared = roundTrip({ a: big, b: big });
  assert.equal(shared.a, shared.b);
  assert.deepEqual(shared.a, big);
  const buf = roundTrip(new Uint8Array([1, 2, 3]).buffer);
  assert.ok(buf instanceof ArrayBuffer);
  assert.deepEqual(new Uint8Array(buf), new Uint8Array([1, 2, 3]));
});

test("typed-array subarrays keep their window, and views sharing a buffer still share it", () => {
  const buffer = new Uint8Array([10, 20, 30, 40, 50]).buffer;
  const out = roundTrip({
    whole: new Uint8Array(buffer),
    sub: new Uint8Array(buffer, 1, 3),
  });
  assert.deepEqual([...out.sub], [20, 30, 40]);
  assert.equal(out.sub.byteOffset, 1);
  assert.equal(out.whole.buffer, out.sub.buffer, "both views must share one revived buffer");
  out.whole[2] = 99;
  assert.equal(out.sub[1], 99);
});

test("a `DataView` revives with its bytes, and a sub-view keeps its offset", () => {
  const buffer = new Uint8Array([1, 2, 3, 4, 5, 6]).buffer;
  const out = roundTrip(new DataView(buffer));
  assert.ok(out instanceof DataView);
  assert.equal(out.getUint32(0), 0x01020304);
  const sub = roundTrip(new DataView(buffer, 2, 3));
  assert.equal(sub.byteOffset, 2);
  assert.equal(sub.byteLength, 3);
  assert.equal(sub.getUint8(0), 3);
});

test("every Temporal type revives as an instance with the same value", () => {
  const values = [
    Temporal.Duration.from("P1Y2M3DT4H5M6.789S"),
    Temporal.Instant.from("2026-01-02T03:04:05.123456789Z"),
    Temporal.PlainDate.from("2026-01-02"),
    Temporal.PlainTime.from("03:04:05.123"),
    Temporal.PlainDateTime.from("2026-01-02T03:04:05"),
    Temporal.PlainMonthDay.from("--01-02"),
    Temporal.PlainYearMonth.from("2026-01"),
    Temporal.ZonedDateTime.from("2026-01-02T03:04:05+01:00[Europe/Berlin]"),
  ];
  for (const v of values) {
    const out = roundTrip(v);
    assert.equal(Object.getPrototypeOf(out), Object.getPrototypeOf(v));
    assert.equal(out.toString(), v.toString());
  }
});

// ---------- `</script>` injection safety via uneval ----------

test("strings containing `</script>` are escaped by devalue.uneval — `</script>` never appears verbatim", () => {
  const ser = createSerializer();
  const src = ser.serialize({ html: "</script><script>alert(1)" });
  assert.doesNotMatch(src, /<\/script>/);
  // devalue.uneval encodes `<` as `<` inside string literals.
  assert.match(src, /\\u003C\/script>/i);
});
