export interface PageProps {
  /** The URL of the request that resulted in this page being rendered. */
  url: URL;

  /** The route matcher (e.g. /blog/:id) that the request matched for this page
   * to be rendered. */
  route: string;

  /**
   * The paramteres that were matched from the route.
   *
   * For the `/foo/:bar` route with url `/foo/123`, `params` would be
   * `{ bar: '123' }`. For a route with no matchers, `params` would be `{}`. For
   * a wildcard route, like `/foo/:path*` with url `/foo/bar/baz`, `params` would
   * be `{ path: [ 'bar', 'baz' ] }`.
   */
  params: Record<string, string | string[]>;
}

export interface PageConfig {
  /**
   * Setting this flag to `false` disables all client side runtime JS. This
   * means that all interactivity on the client that depends on Preact or other
   * JS code will not function. This option is set to `true` (runtime javascript
   * is enabled) by default.
   *
   * It is recommended to disable runtime JavaScript for static pages that do
   * not require interactivity, like marketing or blog pages.
   */
  runtimeJS?: boolean;
}
