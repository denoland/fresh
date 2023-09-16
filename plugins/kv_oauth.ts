import { handleCallback, signIn, signOut } from "./kv_oauth/plugin_deps.ts";
import type { OAuth2Client } from "./kv_oauth/plugin_deps.ts";
import type { Plugin } from "../server.ts";

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
export default function kvOAuthPlugin(
  oauth2Client: OAuth2Client,
  options?: KvOAuthPluginOptions,
): Plugin {
  return {
    name: "kv-oauth",
    routes: [
      {
        path: options?.signInPath ?? "/oauth/signin",
        handler: async (req) => await signIn(req, oauth2Client),
      },
      {
        path: options?.callbackPath ?? "/oauth/callback",
        handler: async (req) => {
          // Return object also includes `accessToken` and `sessionId` properties.
          const { response } = await handleCallback(req, oauth2Client);
          return response;
        },
      },
      {
        path: options?.signOutPath ?? "/oauth/signout",
        handler: signOut,
      },
    ],
  };
}
