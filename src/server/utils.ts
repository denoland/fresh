/**
 * Returns true when the current process deno run process is building. This is used to guard build-dependent code.
 * Shorthand for the following:
 * `Deno.args.includes("build")`
 *
 * @example
 * ```
 *  if (IS_BUILD_MODE) {
 *    console.log('This is code run during build!');
 *  } else {
 *    console.log('This is code run without build!');
 *  }
 * ```
 *
 * Use this to restrict aspects of code from running during ahead of time builds.
 */
export const IS_BUILD_MODE = Deno.args.includes("build");
