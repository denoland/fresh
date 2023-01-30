/** 
 * Hack to make vendoreing work with fresh.
 * 
 * The idea is to import missing modules so deno vendor add all necessary 
 * modules to /vendor folder.
 * */
// This may be removed once this is fixed: https://github.com/denoland/deno/issues/16108
const _vendor0 = () => import("preact/jsx-runtime");

// These are the fresh's entrypoints not imported by anyone else: 
// https://github.com/denoland/fresh/blob/41befe3b382354e35ef8bacb8f8905a186920a1f/src/server/bundle.ts#L65
const _vendor1 = () => import("$fresh/src/runtime/main_dev.ts");
const _vendor2 = () => import("$fresh/src/runtime/main.ts");

