# Data fetching

Not all pages can be server rendered synchronously - some pages are dynamic and
require fetching some data from an external source. This data fetching is often
asynchronous.

Fresh supports asynchronous data fetching in handlers. This is not done during
rendering, but before rendering in the route
handler<!-- TODO: link route handlers page -->.

## Fetching data in a `handler`

To fetch data, you must first define a custom `handler` function. This function
is called when the route is requested. In there you can do some handling, and
then return a `Response` object. If you want to render the page, you can call
the `ctx.render` function. This returns a `Promise<Response>` that you can
return from the handler.

The `ctx.render` function takes a single argument, which is some data that you
want to pass to the page template. The data can be accessed in the template via
the `props.data` property.

Here is a usage example of a `handler` fetches a URL as JSON and provides the
resulting data to the template:

```tsx
import { h, Handlers, PageProps, useData } from "../deps.ts";

interface ModuleInfo {
  latest: string;
  versions: string[];
}

export const handler: Handlers<ModuleInfo> = {
  async GET(ctx) {
    const resp = await fetch("https://cdn.deno.land/std/meta/versions.json");
    let data = null;
    if (resp.status === 200) data = await resp.json();
    return ctx.render(data);
  },
};

export default function Page(props: PageProps<ModuleInfo>) {
  const data = props.data;

  if (data === null) {
    return <div>Data not available.</div>;
  }

  const { latest, versions } = data;
  return (
    <p>
      The Deno standard library has {versions.length} versions, with {latest}
      {" "}
      being the most recent.
    </p>
  );
}
```

If you want to fetch data client side, inside of an island, you can use
libraries like `"swr"`, or raw `useEffect` and `useState` as you usually would.
