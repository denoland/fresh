import { expect } from "@std/expect/expect";
import * as babel from "@babel/core";
import { cjsPlugin } from "../patches/commonjs.ts";

function runTest(
  options: { input: string; expected: string; filename?: string },
) {
  const res = babel.transformSync(options.input, {
    filename: options.filename ?? "foo.js",
    babelrc: false,
    plugins: [cjsPlugin],
  });

  const output = res?.code ?? "";
  expect(output).toEqual(options.expected);
}

const INIT = `var exports = {},
  module = {};
Object.defineProperty(module, "exports", {
  get() {
    return exports;
  },
  set(value) {
    exports = value;
  }
});`;

const DEFAULT_EXPORT = `const _default = exports.default ?? exports;`;
const DEFAULT_EXPORT_END = `export default _default;
export var __require = exports;`;
const IMPORT_REQUIRE = `import { createRequire } from "node:module";
const require = createRequire(import.meta.url);`;
const EXPORT_ES_MODULE = `export var __esModule = exports.__esModule;`;

Deno.test("commonjs - module.exports default", () => {
  runTest({
    input: `module.exports = async function () {};`,
    expected: `${INIT}
module.exports = async function () {};
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - module.exports default primitive", () => {
  runTest({
    input: `module.exports = 42;`,
    expected: `${INIT}
module.exports = 42;
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - exports with default + named", () => {
  runTest({
    input: `exports.__esModule = true;
exports.default = 'x';
exports.foo = 'foo';`,
    expected: `${INIT}
exports.__esModule = true;
exports.default = 'x';
exports.foo = 'foo';
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - module.exports with default + named", () => {
  runTest({
    input: `module.exports.__esModule = true;
module.exports.default = 'x';
module.exports.foo = 'foo';`,
    expected: `${INIT}
module.exports.__esModule = true;
module.exports.default = 'x';
module.exports.foo = 'foo';
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - Object es module flag with named clash", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
exports.foo = 'bar';
const foo = 'also bar';
`,
    expected: `${INIT}
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.foo = 'bar';
const foo = 'also bar';
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - Object es module flag with named + default", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
exports.default = 'foo';
exports.foo = 'bar';
`,
    expected: `${INIT}
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.default = 'foo';
exports.foo = 'bar';
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - esModule flag only", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });`,
    expected: `${INIT}
Object.defineProperty(exports, "__esModule", {
  value: true
});
const _default = exports.default ?? exports;
export default _default;
export var __require = exports;
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - esModule flag only #2", () => {
  runTest({
    input:
      `Object.defineProperty(module.exports, "__esModule", { value: true });`,
    expected: `${INIT}
Object.defineProperty(module.exports, "__esModule", {
  value: true
});
const _default = exports.default ?? exports;
export default _default;
export var __require = exports;
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - esModule flag only minified #3", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: !0 });`,
    expected: `${INIT}
Object.defineProperty(exports, '__esModule', {
  value: !0
});
const _default = exports.default ?? exports;
export default _default;
export var __require = exports;
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - exports only named", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
exports.foo = 'bar';
exports.bar = 'foo';
`,
    expected: `${INIT}
Object.defineProperty(exports, '__esModule', {
  value: true
});
exports.foo = 'bar';
exports.bar = 'foo';
var _foo = exports.foo;
var _bar = exports.bar;
export { _foo as foo, _bar as bar };
${DEFAULT_EXPORT}
_default.foo = _foo;
_default.bar = _bar;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - require", () => {
  runTest({
    input: `var foo = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
var foo = _mod.__require ?? _mod.default ?? _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require destructure", () => {
  runTest({
    input: `var { foo } = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
var {
  foo
} = _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require assign", () => {
  runTest({
    input: `foo = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
foo = _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require assign pattern", () => {
  runTest({
    input: `foo = require("tape");
console.log(foo);
`,
    expected: `import * as _mod from "tape";
foo = _mod;
console.log(foo);`,
  });
});

Deno.test("commonjs - require function call", () => {
  runTest({
    input: `var a = require('./a')()`,
    expected: `import * as _mod from './a';
var a = (_mod.__require ?? _mod.default ?? _mod)();`,
  });
});

Deno.test("commonjs - require var decls", () => {
  runTest({
    input: `var a = require('./a'), b = 42;`,
    expected: `import * as _mod from './a';
var a = _mod.__require ?? _mod.default ?? _mod,
  b = 42;`,
  });
});

Deno.test("commonjs - duplicate exports", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });
exports.trace = void 0;
exports.trace = 'foo'`,
    expected: `${INIT}
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.trace = void 0;
exports.trace = 'foo';
var _trace = exports.trace;
export { _trace as trace };
${DEFAULT_EXPORT}
_default.trace = _trace;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - cleared exports", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = exports.bar = void 0;
exports.foo = 'foo'`,
    expected: `${INIT}
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.foo = 'foo';
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - define exports", () => {
  runTest({
    input: `var utils_1 = require("./bar");
Object.defineProperty(exports, "foo", { enumerable: true, get: function () { return utils_1.foo; } });`,
    expected: `${INIT}
import * as _mod from "./bar";
var utils_1 = _mod.__require ?? _mod.default ?? _mod;
exports.foo = utils_1.foo;
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - define exports #2", () => {
  runTest({
    input: `var utils_1 = require("./bar");
Object.defineProperty(exports, "foo", { enumerable: true, get() { return utils_1.foo; } });`,
    expected: `${INIT}
import * as _mod from "./bar";
var utils_1 = _mod.__require ?? _mod.default ?? _mod;
exports.foo = utils_1.foo;
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - define exports #3", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });
exports._globalThis = void 0;
exports._globalThis = typeof globalThis === 'object' ? globalThis : global;`,
    expected: `${INIT}
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._globalThis = void 0;
exports._globalThis = typeof globalThis === 'object' ? globalThis : global;
var _globalThis = exports._globalThis;
export { _globalThis };
${DEFAULT_EXPORT}
_default._globalThis = _globalThis;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - named function", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });
function foo() {};
exports.foo = foo;`,
    expected: `${INIT}
Object.defineProperty(exports, "__esModule", {
  value: true
});
function foo() {}
exports.foo = foo;
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - detect esbuild shims", () => {
  runTest({
    input: `__exportStar(require("./globalThis"), exports);`,
    expected: `${INIT}
import * as _ns from "./globalThis";
export * from "./globalThis";
${DEFAULT_EXPORT}
for (var _k in _ns) if (_k !== "default" && _k !== "__esModule" && Object.prototype.hasOwnProperty.call(_ns, _k)) _default[_k] = _ns[_k];
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - exports.default", () => {
  runTest({
    input: `exports.default = {}`,
    expected: `${INIT}
exports.default = {};
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - multiple same name", () => {
  runTest({
    input: `exports.VERSION = void 0;
exports.VERSION = '1.9.0';`,
    expected: `${INIT}
exports.VERSION = void 0;
exports.VERSION = '1.9.0';
var _VERSION = exports.VERSION;
export { _VERSION as VERSION };
${DEFAULT_EXPORT}
_default.VERSION = _VERSION;
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - export enum", () => {
  runTest({
    input: `Object.defineProperty(exports, "__esModule", { value: true });
exports.DiagLogLevel = void 0;
var DiagLogLevel;
(function (DiagLogLevel) {
    DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
})(DiagLogLevel = exports.DiagLogLevel || (exports.DiagLogLevel = {}));`,
    expected: `${INIT}
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DiagLogLevel = void 0;
var DiagLogLevel;
(function (DiagLogLevel) {
  DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
})(DiagLogLevel = exports.DiagLogLevel || (exports.DiagLogLevel = {}));
var _DiagLogLevel = exports.DiagLogLevel;
export { _DiagLogLevel as DiagLogLevel };
${DEFAULT_EXPORT}
_default.DiagLogLevel = _DiagLogLevel;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - require", () => {
  runTest({
    input: `module.exports = { __esModule: true, default: { foo: 'bar' }}`,
    expected: `${INIT}
module.exports = {
  __esModule: true,
  default: {
    foo: 'bar'
  }
};
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - export default object", () => {
  runTest({
    input: `Object.defineProperty(exports, '__esModule', { value: true });
module.exports = { foo: 'bar' };
`,
    expected: `${INIT}
Object.defineProperty(exports, '__esModule', {
  value: true
});
module.exports = {
  foo: 'bar'
};
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - detect iife wrapper", () => {
  runTest({
    input: `;(function (sax) {
  sax.foo = "foo";
})(typeof exports === 'undefined' ? this.sax = {} : exports);`,
    expected: `${INIT}
(function (sax) {
  sax.foo = "foo";
})(exports);
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - re-export", () => {
  runTest({
    input:
      `;var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./node"), exports);`,
    expected: `${INIT}
import * as _ns from "./node";
var __createBinding = this && this.__createBinding || (Object.create ? function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  Object.defineProperty(o, k2, {
    enumerable: true,
    get: function () {
      return m[k];
    }
  });
} : function (o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});
var __exportStar = this && this.__exportStar || function (m, exports) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
export * from "./node";
${DEFAULT_EXPORT}
for (var _k in _ns) if (_k !== "default" && _k !== "__esModule" && Object.prototype.hasOwnProperty.call(_ns, _k)) _default[_k] = _ns[_k];
${DEFAULT_EXPORT_END}
${EXPORT_ES_MODULE}`,
  });
});

Deno.test("commonjs - assign module.exports", () => {
  runTest({
    input: `module.exports = { foo: 1 };`,
    expected: `${INIT}
module.exports = {
  foo: 1
};
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - require non-analyzable arg", () => {
  runTest({
    input: `const pkg = require(path.join(basedir, "package.json"))`,
    expected: `import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pkg = require(path.join(basedir, "package.json"));`,
  });
});

Deno.test("commonjs - keep binding", () => {
  runTest({
    input: `export var __createBinding = Object.create ? 1 : 2;`,
    expected: `export var __createBinding = Object.create ? 1 : 2;`,
  });
});

Deno.test("commonjs - require lazy import", () => {
  runTest({
    input: `if (typeof process.env.NODE_PG_FORCE_NATIVE !== 'undefined') {
  module.exports = new PG(require('./native'))
} else {
  module.exports = new PG(Client)

  // lazy require native module...the native module may not have installed
  Object.defineProperty(module.exports, 'native', {
    configurable: true,
    enumerable: false,
    get() {
      let native = null
      try {
        native = new PG(require('./native'))
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
          throw err
        }
      }

      // overwrite module.exports.native so that getter is never called again
      Object.defineProperty(module.exports, 'native', {
        value: native,
      })

      return native
    },
  })
}`,
    expected: `${INIT}
${IMPORT_REQUIRE}
if (typeof process.env.NODE_PG_FORCE_NATIVE !== 'undefined') {
  module.exports = new PG(require('./native'));
} else {
  module.exports = new PG(Client);

  // lazy require native module...the native module may not have installed
  Object.defineProperty(module.exports, 'native', {
    configurable: true,
    enumerable: false,
    get() {
      let native = null;
      try {
        native = new PG(require('./native'));
      } catch (err) {
        if (err.code !== 'MODULE_NOT_FOUND') {
          throw err;
        }
      }

      // overwrite module.exports.native so that getter is never called again
      Object.defineProperty(module.exports, 'native', {
        value: native
      });
      return native;
    }
  });
}
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - wrapped iife binding", () => {
  runTest({
    input: `"production" !== process.env.NODE_ENV && (function() {
  exports.foo = 123
})()`,
    expected: `${INIT}
"production" !== process.env.NODE_ENV && function () {
  exports.foo = 123;
}();
var _foo = exports.foo;
export { _foo as foo };
${DEFAULT_EXPORT}
_default.foo = _foo;
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - re-export #2", () => {
  runTest({
    input: `module.exports = require("foo");`,
    expected: `${INIT}
export * from "foo";
import * as _mod from "foo";
module.exports = _mod;
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}`,
  });
});

Deno.test("commonjs - keep require() in .mjs", () => {
  runTest({
    filename: "foo.mjs",
    input: `try { require("foo"); } catch {}`,
    expected: `try {
  require("foo");
} catch {}`,
  });
});

Deno.test("commonjs - keep conditional require() in ESM file", () => {
  runTest({
    filename: "foo.mjs",
    input: `try { require("foo"); } catch {};
export {};`,
    expected: `try {
  require("foo");
} catch {}
export {};`,
  });
});

Deno.test("commonjs - CJS turned ESM module", () => {
  runTest({
    filename: "foo.mjs",
    input: `module.exports.create = confettiCannon;
export default module.exports;
export var create = module.exports.create;`,
    expected: `module.exports.create = confettiCannon;
export default module.exports;
export var create = module.exports.create;`,
  });
});

Deno.test("commonjs - minified __esModule", () => {
  runTest({
    filename: "foo.js",
    input: `
const m = module.exports;
const a = Object.defineProperty;
a(m, "__esModule", { value: !0 });`,
    expected: `${INIT}
const m = module.exports;
const a = Object.defineProperty;
a(m, "__esModule", {
  value: !0
});
${DEFAULT_EXPORT}
${DEFAULT_EXPORT_END}
export var __esModule = exports.__esModule;`,
  });
});

Deno.test("commonjs - esbuild __importDefault", () => {
  runTest({
    input:
      `var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const node_events_1 = __importDefault(require("node:events"));`,
    expected: `import * as _mod from "node:events";
var __importDefault = this && this.__importDefault || function (mod) {
  return mod && mod.__esModule ? mod : {
    "default": mod
  };
};
const node_events_1 = __importDefault(_mod.default ?? _mod);`,
  });
});
