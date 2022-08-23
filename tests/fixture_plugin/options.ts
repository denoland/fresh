import { FreshOptions } from "$fresh/server.ts";
import cssInjectPlugin from "./utils/css-inject-plugin.ts";
import jsInjectPlugin from "./utils/js-inject-plugin.ts";

export default { plugins: [cssInjectPlugin, jsInjectPlugin] } as FreshOptions;
