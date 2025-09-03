// var exports = {},
//   module = {};
// Object.defineProperty(module, "exports", {
//   get() {
//     return exports;
//   },
//   set(value) {
//     exports = value;
//   },
// });
// const _mod2 = {};
// const _mod = {};
// exports.foo = exports.bar = void 0;
// const foo = _mod.default ?? _mod;
// const bar = _mod2.default ?? _mod2;
// Object.defineProperty(exports, "foo", {
//   enumerable: true,
//   get: function () {
//     return foo;
//   },
// });
// Object.defineProperty(exports, "bar", {
//   enumerable: true,
//   get: function () {
//     return bar;
//   },
// });
// var _foo = exports.foo;
// var _bar = exports.bar;
// export { _bar as bar, _foo as foo };
// const _default = exports.default ?? exports;
// console.log({ _default });
// _default.foo = _foo;
// _default.bar = _bar;
// export default _default;

var exports = {},
  module = {};
Object.defineProperty(module, "exports", {
  get() {
    return exports;
  },
  set(value) {
    exports = value;
  },
});
const _mod2 = {};
const _mod = {};
exports.foo = exports.bar = void 0;
const foo = _mod.default ?? _mod;
const bar = _mod2.default ?? _mod2;
exports.foo = foo;
exports.bar = bar;
var _foo = exports.foo;
var _bar = exports.bar;
export { _bar as bar, _foo as foo };
const _default = exports.default ?? exports;
_default.foo = _foo;
_default.bar = _bar;
export default _default;
