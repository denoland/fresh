// deno-lint-ignore no-process-global
if (typeof process !== "undefined") {
  module.exports = require("./commonjs_server.cjs");
} else {
  module.exports = require("./commonjs_browser.cjs");
}
