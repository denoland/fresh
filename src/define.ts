import type { AnyComponent } from "preact";
import type { HandlerByMethod, HandlerFn, RouteHandler } from "./handlers.ts";
import type { Middleware } from "./middlewares/mod.ts";
import type { PageProps } from "./render.ts";

/**
 * A set of define functions that enable better type inference and code
 * completion when defining routes and middleware.
 *
 * To create a define object, call {@link createDefine}.
 */
export interface Define<State> {
  /**
   * Define a {@link RouteHandler} object. This function returns the passed
   * input as-is.
   *
   * You can use this function to help the TypeScript compiler infer the types
   * of your route handlers. For example:
   *
   * ```ts
   * import { define } from "../utils.ts";
   *
   * export const handler = define.handlers((ctx) => {
   *   ctx.url; // ctx is inferred to be a FreshContext object, so this is a URL
   *   return new Response("Hello, world!");
   * });
   * ```
   *
   * This is particularly useful when combined with the {@link Define.page}
   * helper function, which can infer the data type from the handler function.
   * For more information, see {@link Define.page}.
   *
   * You can also pass an explicit type argument to ensure that all data
   * returned from the handler is of the correct type:
   *
   * ```ts
   * import { page } from "fresh";
   * import { define } from "../utils.ts";
   *
   * export const handler = define.handlers<{ slug: string }>({
   *   async GET(ctx) {
   *     const slug = ctx.params.slug; // slug is inferred to be a string
   *     return page({ slug });
   *   },
   *
   *   // This method will cause a type error because the data object is missing
   *   // the required `slug` property.
   *   async POST(ctx) {
   *     return page({ });
   *   },
   * });
   * ```
   *
   * @typeParam Data The type of data that the handler returns. This will be inferred from the handler methods if not provided.
   * @typeParam Handlers This will always be inferred from the input object. Do not manually specify this type.
   */
  handlers<
    Data,
    Handlers extends RouteHandler<Data, State> = RouteHandler<Data, State>,
  >(handlers: Handlers): typeof handlers;

  /**
   * Define a page component that will be rendered when a route handler returns
   * data. This function returns the passed input as-is.
   *
   * You can use this function to help the TypeScript compiler infer the types
   * of the data that your page component receives. For example:
   *
   * ```ts
   * import { define } from "../utils.ts";
   *
   * export default define.page((props) => {
   *   const slug = props.params.slug; // Because props is inferred to be a FreshContext object, slug is inferred to be a string
   *   return <h1>{slug}</h1>;
   * });
   * ```
   *
   * This is particularly useful when combined with the {@link handlers}
   * helper function, in which case the data type will be inferred from the
   * return type of the handler method.
   *
   * ```ts
   * import { page } from "fresh";
   * import { define } from "../utils.ts";
   *
   * export const handler = define.handlers({
   *   async GET(ctx) {
   *     const slug = ctx.params.slug; // slug is inferred to be a string
   *     return page({ slug });
   *  },
   * });
   *
   * export default define.page<typeof handler>(({ data }) => {
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
  page<
    // deno-lint-ignore no-explicit-any
    Handler extends RouteHandler<any, State> = never,
    Data = Handler extends HandlerFn<infer Data, State> ? Data
      : Handler extends HandlerByMethod<infer Data, State> ? Data
      : never,
  >(render: AnyComponent<PageProps<Data, State>>): typeof render;

  /**
   * Define a {@link Middleware} that will be used to process requests before
   * they are passed to the route handler. This function returns the passed
   * input as-is.
   *
   * You can use this function to help the TypeScript compiler infer the types
   * of the context object that your middleware receives. For example:
   *
   * ```ts
   * import { define } from "../utils.ts";
   *
   * export const middleware = define.middleware((ctx) => {
   *   ctx.url; // ctx is inferred to be a FreshContext object, so this is a URL
   *   return ctx.next();
   * });
   * ```
   *
   * You may also pass an array of middleware functions to this function.
   *
   * @typeParam M The type of the middleware function. This will be inferred from the input function. Do not manually specify this type.
   */
  middleware<M extends Middleware<State> | Middleware<State>[]>(
    middleware: M,
  ): typeof middleware;
}

/**
 * Create a set of define functions that enable better type inference and code
 * completion when defining routes and middleware.
 *
 * To use, call this function in a central file and export the result. In your
 * route and middleware files, import the {@link Define|define object} and use
 * it to define your routes and middleware using the
 * {@link Define.handlers|define.handlers},
 * {@link Define.page|define.page}, and
 * {@link Define.middleware|define.middleware} functions.
 *
 * @typeParam State The type of the state object that is passed to all middleware and route handlers.
 */
export function createDefine<State>(): Define<State> {
  return {
    handlers(handlers) {
      return handlers;
    },
    page(render) {
      return render;
    },
    middleware(middleware) {
      return middleware;
    },
  };
}
