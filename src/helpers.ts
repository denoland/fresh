import type { AnyComponent } from "preact";
import type { HandlerByMethod, RouteHandler } from "./handlers.ts";
import type { FreshContext } from "./context.ts";
import type { Middleware } from "./middlewares/mod.ts";

/**
 * A set of helper functions that enable better type inference and code
 * completion when defining routes and middleware.
 *
 * To create a helpers object, call {@link createHelpers}.
 */
export interface Helpers<State> {
  /**
   * Define a {@link RouteHandler} object. This function returns the passed
   * input as-is.
   *
   * You can use this function to help the TypeScript compiler infer the types
   * of your route handlers. For example:
   *
   * ```ts
   * export const handler = helpers.defineHandlers((ctx) => {
   *   ctx.url; // ctx is inferred to be a FreshContext object, so this is a URL
   *   return new Response("Hello, world!");
   * });
   * ```
   *
   * This is particularly useful when combined with the {@link definePage}
   * helper function, which can infer the data type from the handler function.
   * For more information, see {@link definePage}.
   *
   * You can also pass an explicit type argument to ensure that all data
   * returned from the render function is of the correct type:
   *
   * ```ts
   * export const handler = helpers.defineHandlers<{ slug: string }>({
   *   async GET(ctx) {
   *     const slug = ctx.params.slug; // slug is inferred to be a string
   *      return { data: { slug } };
   *   },
   *
   *   // This method will cause a type error because the data object is missing
   *   // the required `slug` property.
   *   async POST(ctx) {
   *     return { data: { } };
   *   },
   * });
   * ```
   *
   * @typeParam Data The type of data that the handler returns. This will be inferred from the handler methods if not provided.
   * @typeParam Handlers This will always be inferred from the input object. Do not manually specify this type.
   */
  defineHandlers<
    Data,
    Handlers extends RouteHandler<Data, State> = RouteHandler<Data, State>,
  >(
    handlers: Handlers,
  ): typeof handlers;

  /**
   * Define a page component that will be rendered when a route handler returns
   * data. This function returns the passed input as-is.
   *
   * You can use this function to help the TypeScript compiler infer the types
   * of the data that your page component receives. For example:
   *
   * ```ts
   * export default helpers.definePage((props) => {
   *   const slug = props.params.slug; // Because props is inferred to be a FreshContext object, slug is inferred to be a string
   *   return <h1>{slug}</h1>;
   * });
   * ```
   *
   * This is particularly useful when combined with the {@link defineHandlers}
   * helper function, in which case the data type will be inferred from the
   * return type of the handler method.
   *
   * ```ts
   * export const handler = defineHandlers({
   *   async GET(ctx) {
   *     const slug = ctx.params.slug; // slug is inferred to be a string
   *     return { data: { slug } };
   *  },
   * });
   *
   * export default definePage<typeof handler>(({ data }) => {
   *   const slug = data.slug; // slug is inferred to be a string here
   *   return <h1>{slug}</h1>;
   * });
   * ```
   *
   * As a rule of thumb, always use this function to define your page
   * components. If you also have a handler for this route, pass the handler
   * object as a type argument to this function. If you do not have a handler,
   * omit the type argument.
   *
   * @typeParam Handler The type of the handler object that this page component is associated with. If this route has a handler, pass the handler object as a type argument to this function, e.g. `typeof handler`. If this route does not have a handler, omit this type argument.
   * @typeParam Data The type of data that the page component receives. This will be inferred from the handler methods if not provided. In very advanced use cases, you can specify `never` to the `Handler` type argument and provide the `Data` type explicitly.
   */
  definePage<
    Handler extends RouteHandler<unknown, State> = never,
    Data = Handler extends HandlerByMethod<infer Data, State> ? Data : never,
  >(
    render: AnyComponent<FreshContext<Data, State> & { Component: () => null }>,
  ): typeof render;

  /**
   * Define a {@link Middleware} that will be used to process requests before
   * they are passed to the route handler. This function returns the passed
   * input as-is.
   *
   * You can use this function to help the TypeScript compiler infer the types
   * of the context object that your middleware receives. For example:
   *
   * ```ts
   * export const middleware = helpers.defineMiddleware((ctx) => {
   *   ctx.url; // ctx is inferred to be a FreshContext object, so this is a URL
   *   return ctx.next();
   * });
   * ```
   *
   * You may also pass an array of middleware functions to this function.
   *
   * @typeParam M The type of the middleware function. This will be inferred from the input function. Do not manually specify this type.
   */
  defineMiddleware<M extends Middleware<State>>(
    middleware: M,
  ): typeof middleware;
}

/**
 * Create a set of helper functions that enable better type inference and code
 * completion when defining routes and middleware.
 *
 * To use, call this function in a central file and export the result. In your
 * route and middleware files, import the {@link Helpers|helpers object} and use
 * them to define your routes and middleware using the
 * {@link Helpers.defineHandlers|defineHandlers},
 * {@link Helpers.definePage|definePage}, and
 * {@link Helpers.defineMiddleware|defineMiddleware} functions.
 *
 * @typeParam State The type of the state object that is passed to all middleware and route handlers.
 */
export function createHelpers<State>(): Helpers<State> {
  return {
    defineHandlers(handlers) {
      return handlers;
    },
    definePage(render) {
      return render;
    },
    defineMiddleware(middleware) {
      return middleware;
    },
  };
}
