// Copyright 2023 the Deno authors. All rights reserved. MIT license.
import { assert, assertArrayIncludes } from "$std/testing/asserts.ts";
import { colors } from "$fresh/src/server/deps.ts";
import { createRoutes } from "$fresh/plugins/kv_oauth.ts";

function randomOAuthConfig() {
  return {
    clientId: crypto.randomUUID(),
    clientSecret: crypto.randomUUID(),
    authorizationEndpointUri: `https://${crypto.randomUUID()}.com/authorize`,
    tokenUri: `https://${crypto.randomUUID()}.com/token`,
  };
}

// @ts-ignore openKv is only available with --unstable
const isKvEnabled = typeof Deno.openKv === "function";
if (!isKvEnabled) {
  console.log(
    colors.yellow(`Skipping Deno KV tests. Pass "--unstable" to run them.`),
  );
}

Deno.test({
  name: "createRoutes() has all handlers defined with default OAuth path",
  ignore: !isKvEnabled,
  fn: () => {
    const routes = createRoutes(randomOAuthConfig());
    assert(routes.every((route) => route.handler !== undefined));
    assertArrayIncludes(routes.map((route) => route.path), [
      "/oauth/signin",
      "/oauth/callback",
      "/oauth/signout",
    ]);
  },
});

Deno.test({
  name: "createRoutes() has all handlers defined with set OAuth path",
  ignore: !isKvEnabled,
  fn: () => {
    const oauthPath = "/" + crypto.randomUUID();
    const routes = createRoutes(randomOAuthConfig(), oauthPath);
    assert(routes.every((route) => route.handler !== undefined));
    assertArrayIncludes(routes.map((route) => route.path), [
      oauthPath + "/signin",
      oauthPath + "/callback",
      oauthPath + "/signout",
    ]);
  },
});
