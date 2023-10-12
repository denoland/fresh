import { FreshConfig } from "$fresh/server.ts";
import cssInjectPlugin from "./utils/css-inject-plugin.ts";
import jsInjectPlugin from "./utils/js-inject-plugin.ts";
import cssInjectPluginAsync from "./utils/css-inject-plugin-async.ts";
import routePlugin from "./utils/route-plugin.ts";
import secondMiddlewarePlugin from "$fresh/tests/fixture_plugin/utils/second-middleware-plugin.ts";

export default {
  plugins: [
    cssInjectPlugin,
    jsInjectPlugin,
    cssInjectPluginAsync,
    routePlugin({ title: "Title Set From Plugin Config" }),
    secondMiddlewarePlugin(),
  ],
} as FreshConfig;
