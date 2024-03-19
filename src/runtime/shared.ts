/**
 * Returns true when the current runtime is the browser and false otherwise. This is used for guard runtime-dependent code.
 * Shorthand for the following:
 * `typeof document !== "undefined"`
 *
 * @example
 * ```
 *  if (IS_BROWSER) {
 *    alert('This is running in the browser!');
 *  } else {
 *    console.log('This code is running on the server, no access to window or alert');
 *  }
 * ```
 *
 * Without this guard, alert pauses the server until return is pressed in the console.
 */
export const IS_BROWSER = typeof document !== "undefined";
