// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import {
  assert,
  assertArrayIncludes,
  assertNotEquals,
} from "$std/testing/asserts.ts";
import { colors } from "$fresh/src/server/deps.ts";

// @ts-ignore openKv is only available with --unstable
const hasKVEnabled = typeof Deno.openKv === "function";
if (!hasKVEnabled) {
  console.log(
    colors.yellow(`Skipping Deno KV tests. Pass "--unstable" to run them.`),
  );
}

Deno.test(
  "kvOAuthPlugin() works correctly",
  { ignore: !hasKVEnabled },
  async (test) => {
    const { oauth2Client } = await import("./plugin_test_utils.ts");
    const kvOAuthPlugin = (await import("$fresh/plugins/kv_oauth.ts")).default;

    await test.step("with default values", () => {
      const plugin = kvOAuthPlugin(oauth2Client);
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
      const plugin = kvOAuthPlugin(oauth2Client, {
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
        [providerKey]: oauth2Client,
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
);
