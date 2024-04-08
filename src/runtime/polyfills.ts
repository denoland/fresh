// deno-lint-ignore-file ban-unknown-rule-code ban-unused-ignore
// Polyfill for old safari versions
if (typeof globalThis === "undefined") {
  // @ts-ignore polyfill
  // deno-lint-ignore no-window
  window.globalThis = window;
}
