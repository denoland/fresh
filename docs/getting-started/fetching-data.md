---
description: |
  Fetch data for routes dynamically by creating a custom handler and passing
  data to the render function. 
---

All of the pages in the demo project so far have not used any dynamic data
during rendering. In real projects, this is often different. In many cases you
may need to read a file from disk (e.g. markdown for a blog post), or fetch some
user data from an API or database.

These operations are all asynchronous. Rendering however, is always synchronous.
Instead of fetching data directly during rendering, it should be loaded in a
route's `handler` function and then passed to the page component via first
argument to `ctx.render()`.

The data that is passed to `ctx.render()` can then be accessed via the
`props.data` field on the page component.

Here is an example of a route that fetches user data from the GitHub API and
renders it in a page component.

```tsx
// routes/github/[username].tsx

import { Handlers, PageProps } from "$fresh/server.ts";

interface User {
  login: string;
  name: string;
  avatar_url: string;
}

export const handler: Handlers<User | null> = {
  async GET(_, ctx) {
    const { username } = ctx.params;
    const resp = await fetch(`https://api.github.com/users/${username}`);
    if (resp.status === 404) {
      return ctx.render(null);
    }
    const user: User = await resp.json();
    return ctx.render(user);
  },
};

export default function Page({ data }: PageProps<User | null>) {
  if (!data) {
    return <h1>User not found</h1>;
  }

  return (
    <div>
      <img src={data.avatar_url} width={64} height={64} />
      <h1>{data.name}</h1>
      <p>{data.login}</p>
    </div>
  );
}
```

The data is first fetched inside of the handler by making an API call to GitHub.
If the API call succeeds, the data is passed to the page component. If the API
call fails, the page component is rendered with `null` as the data. The page
component grabs the data from the props and renders it.
