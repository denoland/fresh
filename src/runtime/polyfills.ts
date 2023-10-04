// Polyfill for old safari versions
if (typeof globalThis === "undefined") {
  // @ts-ignore polyfill
  window.globalThis = window;
}
