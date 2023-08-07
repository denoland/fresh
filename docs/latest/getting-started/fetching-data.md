---
description: |
  Fetch data for routes dynamically by creating a custom handler and passing
  data to the render function.
---

All of the pages in the demo project so far have not used any dynamic data
during rendering. In real projects, this is often different. In many cases you
may need to read a file from disk (e.g. markdown for a blog post), or fetch some
user data from an API or database.

In order to fetch data, the route component must be asynchronous. The `_req`
parameter is mandatory, and it indicates that certain data will be fetched. The
second `ctx` parameter is used to get the route parameters.

Here is an example of a route that fetches user data from the GitHub API and
renders it in a page component.

```tsx
// routes/github/[username].tsx

import { RouteContext } from "$fresh/server.ts";

interface GitHubResponse {
  login: string;
  name: string;
  avatar_url: string;
}

export default async function Page(_req: Request, ctx: RouteContext) {
  const resp = await fetch(
    `https://api.github.com/users/${ctx.params.username}`,
  );

  if (!resp.ok) {
    return <h1>An Error occurred</h1>;
  }

  const { login, name, avatar_url } = await resp.json() as GitHubResponse;

  return (
    <div>
      <img src={avatar_url} width={64} height={64} />
      <h1>{name}</h1>
      <p>{login}</p>
    </div>
  );
}
```

The data is first fetched inside our page component, and we simply check the
`ok` property of our request's response. If the API call was successful, we
should be able to see our div with the user's GitHub image, name, and username.
Otherwise, we should see a heading saying: "An Error occurred."
