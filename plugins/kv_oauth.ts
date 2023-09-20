import { handleCallback, signIn, signOut } from "./kv_oauth/plugin_deps.ts";
import { OAuth2Client } from "./kv_oauth/plugin_deps.ts";
import type { Plugin } from "../server.ts";

/**
 * This is a helper type to infer the routes created by the `kvOAuthPlugin` function.
 *
 * Use a KV OAuth plugin instance to infer the routes paths.
 *
 * @example
 * ```ts
 * // main.ts
 * import { start } from "$fresh/server.ts";
 * import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth@$VERSION/mod.ts";
 * import { kvOAuthPlugin } from "https://deno.land/x/deno_kv_oauth@$VERSION/fresh.ts";
 * import manifest from "./fresh.gen.ts";
 *
 * const kvOAuth = kvOAuthPlugin({
 *   github: createGitHubOAuth2Client(),
 * });
 *
 * export type KVOAuthRoutes = InferOAuthProviders<typeof kvOAuth>;
 * //            ^? type Foo = "/oauth/github/signin" | "/oauth/github/callback" | "/oauth/github/signout"
 *
 * await start(manifest, {
 *   plugins: [kvOAuth],
 * });
 * ```
 */
export type InferOAuthProviders<T, U = T extends Plugin<infer U> ? U : never> =
  {
    [K in keyof U]: K extends string ?
        | `/oauth/${K}/signin`
        | `/oauth/${K}/callback`
        | `/oauth/${K}/signout`
      : never;
  }[keyof U];

export interface KvOAuthPluginOptions {
  /**
   * Sign-in page path
   *
   * @default {"/oauth/signin"}
   */
  signInPath?: string;
  /**
   * Callback page path
   *
   * @default {"/oauth/callback"}
   */
  callbackPath?: string;
  /**
   * Sign-out page path
   *
   * @default {"/oauth/signout"}
   */
  signOutPath?: string;
}

/**
 * This creates handlers for the following routes:
 * - `GET /oauth/signin` for the sign-in page
 * - `GET /oauth/callback` for the callback page
 * - `GET /oauth/signout` for the sign-out page
 *
 * ```ts
 * // main.ts
 * import { start } from "$fresh/server.ts";
 * import kvOAuthPlugin from "$fresh/plugins/kv_oauth.ts";
 * import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth@$VERSION/mod.ts";
 * import manifest from "./fresh.gen.ts";
 *
 * await start(manifest, {
 *   plugins: [
 *     kvOAuthPlugin(createGitHubOAuth2Client())
 *   ]
 * });
 * ```
 */
export function kvOAuthPlugin(
  oauth2Client: OAuth2Client,
  options?: KvOAuthPluginOptions,
): Plugin;

/**
 * This creates handlers for the following routes:
 * - `GET /oauth/[PROVIDER_SLUG]/signin` for the sign-in page
 * - `GET /oauth/[PROVIDER_SLUG]/callback` for the callback page
 * - `GET /oauth/[PROVIDER_SLUG]/signout` for the sign-out page
 *
 * ```ts
 * // main.ts
 * import { start } from "$fresh/server.ts";
 * import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth@$VERSION/mod.ts";
 * import { kvOAuthPlugin } from "https://deno.land/x/deno_kv_oauth@$VERSION/fresh.ts";
 * import manifest from "./fresh.gen.ts";
 *
 * await start(manifest, {
 *   plugins: [
 *      kvOAuthPlugin({
 *          github: createGitHubOAuth2Client(),
 *      })
 *   ]
 * });
 * ```
 */
export function kvOAuthPlugin<
  const TProviders extends Record<string, OAuth2Client>,
>(providers: TProviders): Plugin<TProviders>;

/**
 * This creates handlers for the following routes:
 * - `GET /oauth/signin` for the sign-in page
 * - `GET /oauth/callback` for the callback page
 * - `GET /oauth/signout` for the sign-out page
 *
 * ```ts
 * // main.ts
 * import { start } from "$fresh/server.ts";
 * import kvOAuthPlugin from "$fresh/plugins/kv_oauth.ts";
 * import { createGitHubOAuth2Client } from "https://deno.land/x/deno_kv_oauth@$VERSION/mod.ts";
 * import manifest from "./fresh.gen.ts";
 *
 * await start(manifest, {
 *   plugins: [
 *     kvOAuthPlugin(createGitHubOAuth2Client())
 *   ]
 * });
 * ```
 */
export default function kvOAuthPlugin<
  const TProviders extends Record<string, OAuth2Client>,
>(
  ...args: [
    oauth2Client: OAuth2Client,
    options?: KvOAuthPluginOptions,
  ] | [
    providers: TProviders,
  ]
): Plugin<Record<keyof TProviders, unknown>> {
  const routes: Plugin["routes"] = [];

  if (args.length >= 3 || args.length <= 0) {
    throw new Error(
      `Unable to initialise kv-oauth plugin with. Expected 1-2 arguments, got ${args.length}.`,
    );
  }

  const [providersOrOAuth2Client] = args;

  if (providersOrOAuth2Client instanceof OAuth2Client) {
    const [_, options] = args;
    routes.push(
      {
        path: options?.signInPath ?? "/oauth/signin",
        handler: async (req) => await signIn(req, providersOrOAuth2Client),
      },
      {
        path: options?.callbackPath ?? "/oauth/callback",
        handler: async (req) => {
          // Return object also includes `accessToken` and `sessionId` properties.
          const { response } = await handleCallback(
            req,
            providersOrOAuth2Client,
          );
          return response;
        },
      },
      {
        path: options?.signOutPath ?? "/oauth/signout",
        handler: signOut,
      },
    );
  } else {
    Object.entries(providersOrOAuth2Client).forEach((
      [providerName, oauth2Client],
    ) =>
      routes.push(
        {
          path: `/oauth/${providerName}/signin`,
          handler: async (req) => await signIn(req, oauth2Client),
        },
        {
          path: `/oauth/${providerName}/callback`,
          handler: async (req) => {
            // Return object also includes `accessToken` and `sessionId` properties.
            const { response } = await handleCallback(
              req,
              oauth2Client,
            );
            return response;
          },
        },
        {
          path: `/oauth/${providerName}/signout`,
          handler: signOut,
        },
      )
    );
  }

  return {
    name: "kv-oauth",
    routes,
  };
}
