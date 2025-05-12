import { STATUS_TEXT } from "@std/http/status";

/**
 * Error that's thrown when a request fails. Correlates to a
 * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status | HTTP status}.
 *
 * @property status The HTTP status code.
 *
 * @example Basic usage
 * ```ts
 * import { App, HttpError } from "fresh";
 * import { expect } from "@std/expect";
 *
 * const app = new App()
 *   .get("/", () => new Response("ok"))
 *   .get("/not-found", () => {
 *      throw new HttpError(404, "Nothing here");
 *    });
 *
 * const handler = app.handler();
 *
 * try {
 *   await handler(new Request("http://localhost/not-found"))
 * } catch (error) {
 *   expect(error).toBeInstanceOf(HttpError);
 *   expect(error.status).toBe(404);
 *   expect(error.message).toBe("Nothing here");
 * }
 * ```
 */
export class HttpError extends Error {
  /**
   * The HTTP status code.
   *
   * @example Basic usage
   * ```ts
   * import { App, HttpError } from "fresh";
   * import { expect } from "@std/expect";
   *
   * const app = new App()
   *   .get("/", () => new Response("ok"))
   *   .get("/not-found", () => {
   *      throw new HttpError(404, "Nothing here");
   *    });
   *
   * const handler = app.handler();
   *
   * try {
   *   await handler(new Request("http://localhost/not-found"))
   * } catch (error) {
   *   expect(error).toBeInstanceOf(HttpError);
   *   expect(error.status).toBe(404);
   *   expect(error.message).toBe("Nothing here");
   * }
   * ```
   */
  status: number;

  /**
   * Constructs a new instance.
   *
   * @param status The HTTP status code.
   * @param message The error message. Defaults to the status text of the given
   * status code.
   * @param options Optional error options.
   */
  constructor(
    status: keyof typeof STATUS_TEXT,
    message: string = STATUS_TEXT[status],
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = this.constructor.name;
    this.status = status;
  }
}

/**
 * Error that's throw when the app setup fails. Usually caused by
 * `deno task build` not being run before starting the server.
 *
 * @example Basic usage
 * ```ts ignore
 * import { App, SetupError } from "fresh";
 * import { expect } from "@std/expect";
 *
 * const app = new App()
 *   .get("/", () => new Response("ok"))
 *
 * try {
 *   // Throws if `deno task build` was not run beforehand
 *   const handler = await app.handler();
 * } catch (error) {
 *   expect(error).toBeInstanceOf(SetupError);
 *   expect(error.message).toBe("App not setup");
 * }
 * ```
 */
export class SetupError extends Error {
  /**
   * Constructs a new instance.
   *
   * @param message The error message.
   * @param options Optional error options.
   */
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
  }
}
