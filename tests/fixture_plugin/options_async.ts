import { FreshOptions } from "$fresh/server.ts";
import cssInjectPlugin from "./utils/css-inject-plugin-async.ts";
import jsInjectPlugin from "./utils/js-inject-plugin-async.ts";

export default {
  pluginsAsync: [cssInjectPlugin, jsInjectPlugin],
} as FreshOptions;
