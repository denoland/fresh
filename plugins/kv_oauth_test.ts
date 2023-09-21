// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertArrayIncludes,
  assertNotEquals,
} from "$std/testing/asserts.ts";
import { colors } from "$fresh/src/server/deps.ts";

function randomOAuthConfig() {
  return {
    clientId: crypto.randomUUID(),
    clientSecret: crypto.randomUUID(),
    authorizationEndpointUri: `https://${crypto.randomUUID()}.com/authorize`,
    tokenUri: `https://${crypto.randomUUID()}.com/token`,
  };
}

// @ts-ignore openKv is only available with --unstable
const hasKVEnabled = typeof Deno.openKv === "function";
if (!hasKVEnabled) {
  console.log(
    colors.yellow(`Skipping Deno KV tests. Pass "--unstable" to run them.`),
  );
}

Deno.test(
  {
    name: "kvOAuthPlugin() works correctly",
    ignore: !hasKVEnabled,
    sanitizeResources: false,
    fn: async (test) => {
      const kvOAuthPlugin =
        (await import("$fresh/plugins/kv_oauth.ts")).default;

      await test.step("with default values", () => {
        const plugin = kvOAuthPlugin(randomOAuthConfig());
        assertNotEquals(plugin.routes, undefined);
        assert(plugin.routes!.every((route) => route.handler !== undefined));
        assertArrayIncludes(plugin.routes!.map((route) => route.path), [
          "/oauth/signin",
          "/oauth/callback",
          "/oauth/signout",
        ]);
      });

      await test.step("with defined values", () => {
        const signInPath = "/signin";
        const callbackPath = "/callback";
        const signOutPath = "/signout";
        const plugin = kvOAuthPlugin(randomOAuthConfig(), {
          signInPath,
          callbackPath,
          signOutPath,
        });
        assertNotEquals(plugin.routes, undefined);
        assert(plugin.routes!.every((route) => route.handler !== undefined));
        assertArrayIncludes(plugin.routes!.map((route) => route.path), [
          signInPath,
          callbackPath,
          signOutPath,
        ]);
      });

      await test.step("with mapped providers", () => {
        const providerKey = "customProvider";
        const plugin = kvOAuthPlugin({
          [providerKey]: randomOAuthConfig(),
        });
        assertNotEquals(plugin.routes, undefined);
        assert(plugin.routes!.every((route) => route.handler !== undefined));
        assertArrayIncludes(plugin.routes!.map((route) => route.path), [
          `/oauth/${providerKey}/signin`,
          `/oauth/${providerKey}/callback`,
          `/oauth/${providerKey}/signout`,
        ]);
      });
    },
  },
);
