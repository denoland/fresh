# Data fetching

Not all pages can be server rendered synchronously - some pages are dynamic and
require fetching fetching some data from an external source. This data fetching
is often asynchronous.

Fresh supports asynchronous data fetch in server render using suspense. This
allows render to be interupted to wait for a promise to resolve. Once the
promise resolves, the render is retried.

## `useData` hook

To make using asynchronous data sources during server render super easy, fresh
exposes the `useData` hook. This hook takes a key and a fetcher function that
can return a promise. It is invoked once on the server. The server will wait
until the promise resolves, at which point it will render the page with the new
data.

The fetcher for the `useData` hook is never run on the client. Instead the data
that was computed on the server during render will be used.

Here is a usage example of a `useData` hook where the fetcher fetches the URL
provided as the key as JSON:

```tsx
import { h, PageProps, useData } from "../deps.ts";

export default function Page(_props: PageProps) {
  const info = useData("https://cdn.deno.land/std/meta/versions.json", fetcher);

  if (info === null) {
    return <div>Data not available.</div>;
  }

  const { latest, versions } = info;
  return (
    <p>
      The Deno standard library has {versions.length} versions, with {latest}
      {" "}
      being the most recent.
    </p>
  );
}

interface ModuleInfo {
  latest: string;
  versions: string[];
}

async function fetcher(url: string): Promise<ModuleInfo | null> {
  const resp = await fetch(url);
  if (resp.status === 200) return resp.json();
  return null;
}
```

The `useData` can not generate data client side. Calling `useData` on the client
with a key that no data was generated for on the server will result in `useData`
throwing an error.
