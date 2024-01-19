import { FreshConfig } from "$fresh/server.ts";

export default {
  router: {
    ignoreFilePattern: /[\.|_]cy\.[t|j]s(x)?$/,
  },
} as FreshConfig;
