---
description: |
  Use HTTP CRUD methods to perform operations on resources. Learn how to use HTTP handlers to create a RESTful API.
---

Hopefully you are familiar with the HTTP methods. If not, you can learn more
about them in the
[HTTP methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods)
article on MDN.

Using HTTP methods is a common way to create a RESTful API. Fresh supports
common HTTP methods in handlers out of the box. Async HTTP requests are also
supported. Read more about
[custom handlers](/docs/getting-started/custom-handlers).

## GET

`GET` is used to retrieve a resource and is by far the most common HTTP method.
You can use `GET` to fetch database content, markdown, or static files.

```tsx
import { Handlers } from "$fresh/server.ts";
import { User } from "../models/user.ts";

export const handler: Handlers<User | null> = {
  async GET(_, ctx) {
    const UserID = ctx.params;

    // Fetch user from database
    const user = await ctx.db.get<User>(UserID);

    if (resp.status === 404) {
      return ctx.render(null);
    }
    const user: User = await resp.json();
    return ctx.render(user);
  },
};

export default function User({ data }: PageProps<User | null>) {
  return <h1>{`User: ${data.user.name}` ?? "404: User Not found."}!</h1>;
}
```

In this example, we are fetching a user from the database. If the user is not
found, we return `null` to the page. The page will then render a 404 message.
For more information on data handling, see
[Data Fetching](/docs/concepts/data-fetching).

## POST

`POST` is used to create a resource.

```tsx
// /routes/api/create-user.ts

import { Handlers } from "$fresh/server.ts";
import { User } from "../models/user.ts";

export const handler: Handlers<User | null> = {
  async POST(_, ctx) {
    // In a real world application, you would want to validate the data
    const user: User = await ctx.request.json();

    // Create user in database
    const resp = await ctx.db.post(user);

    if (resp.status === 201) {
      return ctx.redirect(`/user/${user.id}`);
    }

    return ctx.redirect("/user/error");
  },
};
```

In this example, we are creating a user in the database. If the user is created,
we redirect to the user's page. If the user is not created, we redirect to an
error page.

## PUT & PATCH

`PUT` and `PATCH` are used to update a resource. while similar, there are
differences and you should use the one that best suits your use case. Read more
about HTTP methods on
[MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

An example of an upadte endpoint using `PUT`:

```tsx
// /routes/api/update-user.ts

import { Handlers } from "$fresh/server.ts";
import { User } from "../models/user.ts";

export const handler: Handlers<User | null> = {
  async PUT(_, ctx) {
    // In a real world application, you would want to validate the data
    const user: User = await ctx.request.json();

    // Update user in database
    const resp = await ctx.db.put(user);

    if (resp.status === 200) {
      return ctx.redirect(`/user/${user.id}`);
    }

    return ctx.redirect("/user/error");
  },
};
```

An example of an upadte endpoint using `PATCH`:

```tsx
// /routes/api/update-user.ts

import { Handlers } from "$fresh/server.ts";
import { User } from "../models/user.ts";

export const handler: Handlers<User | null> = {
  async PATCH(_, ctx) {
    // In a real world application, you would want to validate the data
    const user: User = await ctx.request.json();

    // Update user in database
    const resp = await ctx.db.patch(user);

    if (resp.status === 200) {
      return ctx.redirect(`/user/${user.id}`);
    }

    return ctx.redirect("/user/error");
  },
};
```

## DELETE

`DELETE` is used to delete a resource.

```tsx
// /routes/api/delete-user.ts

import { Handlers } from "$fresh/server.ts";
import { User } from "../models/user.ts";

export const handler: Handlers<User | null> = {
  async DELETE(_, ctx) {
    const UserID = ctx.params;

    // Delete user from database
    const resp = await ctx.db.delete(UserID);

    if (resp.status === 200) {
      return ctx.redirect("/home");
    }

    return ctx.redirect("/user/error");
  },
};
```

In this example, we are deleting a user from the database. If the user is
deleted successfully, we redirect to the home page. If the user is not deleted,
we redirect to an error page.
