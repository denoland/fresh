---
description: |
  Fetch data for routes dynamically by creating a custom handler and passing
  data to the render function.
---

In many cases you may need to read a file from disk (e.g. markdown for a blog
post), or fetch some user data from an API or database. In order to fetch data,
the route component must be asynchronous. The first parameter contains the
client's [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
object. The second `ctx` parameter is used to get the route parameters.

Here is an example of a route that fetches user data from the GitHub API and
renders it in a page component.

```tsx routes/github/[username].tsx
import { defineRoute, RouteContext } from "$fresh/server.ts";

interface GitHubResponse {
  login: string;
  name: string;
  avatar_url: string;
}

export default defineRoute(async (_req, ctx) => {
  const resp = await fetch(
    `https://api.github.com/users/${ctx.params.username}`,
  );

  if (!resp.ok) {
    return <h1>An Error occurred</h1>;
  }

  const { login, name, avatar_url } = (await resp.json()) as GitHubResponse;

  return (
    <div>
      <img src={avatar_url} width={64} height={64} />
      <h1>{name}</h1>
      <p>{login}</p>
    </div>
  );
});
```

> [info]: The `defineRoute` handler is a shortcut that already infers the type
> for you. It expands to the following code:
>
> ```tsx routes/my-route.tsx
> export default async function MyPage(req: Request, ctx: RouteContext) {
>   // ...
> }
> ```
