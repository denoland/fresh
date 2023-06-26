---
description: |
  Use HTTP CRUD methods to perform operations on resources. Learn how to use HTTP handlers to create a RESTful API.
---

The MDN [docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) are a
great resource to learn more about HTTP methods. We'll touch on the four
fundamental methods necessary to create a basic CRUD (create, read, update,
delete) API here. Additionally, we'll briefly mention CORS requests and how
`OPTIONS` comes into play.

Using HTTP methods is a common way to create a REST API. Fresh supports common
HTTP methods in handlers out of the box. Async HTTP requests are also supported.
Read more about custom handlers [here](/docs/getting-started/custom-handlers).

In this example we'll be creating a small API that uses
[Deno KV](https://deno.com/kv) to store users in a database.

Our project structure will look like this (in addition to the rest of the Fresh
code from a new project):

```
├── routes
│   └── api
│       └── users
│           ├── [id].ts
│           └── index.ts
```

In each section about a method, only the relevant handler will be shown. The
full files are available at the bottom for reference.

## POST

`POST` (create) is used to create a resource.

```tsx
// /routes/api/index.ts
async POST(req, _ctx) {
  const body = await req.text();
  const user = JSON.parse(body) as User;
  await upsertUser(user);
  return new Response(JSON.stringify(user));
},
```

Test this with Postman (or your favorite client) with a URL like
`http://localhost:8000/api/users` and a method of `POST`. Make sure to have a
payload like:

```json
{
  "id": "2",
  "name": "TestUserName"
}
```

You should receive the same thing back:

```json
{ "id": "2", "name": "TestUserName" }
```

## GET

`GET` (read) is used to retrieve a resource and is by far the most common HTTP
method. You can use `GET` to fetch database content, markdown, or static files.

```tsx
// /routes/api/[id].ts
async GET(_req, ctx) {
  const id = ctx.params.id;
  const user = await getUserById(id);
  return new Response(JSON.stringify(user));
},
```

Let's practice retrieving our user! A `GET` request to
`http://localhost:8000/api/users/2` should return:

```json
{ "id": "2", "name": "TestUserName" }
```

## PUT (and PATCH)

`PUT` (update) and `PATCH` are used to update a resource. While similar, there
are differences and you should use the one that best suits your use case. Read
more about HTTP methods on
[MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

An example of an update endpoint using `PUT`:

```tsx
// /routes/api/[id].ts
async PUT(req, ctx) {
  const id = ctx.params.id;
  const body = await req.text();
  const userBody = JSON.parse(body) as User;
  updateUserById(id, userBody);
  return new Response(JSON.stringify(userBody));
},
```

Time to change their name. We'll now `PUT` a request to
`http://localhost:8000/api/users/2` like:

```json
{
  "id": "2",
  "name": "New Name"
}
```

We should receive:

```json
{ "id": "2", "name": "New Name" }
```

## DELETE

`DELETE` (delete) is used to delete a resource.

```tsx
// /routes/api/[id].ts
  async DELETE(_req, ctx) {
    const id = ctx.params.id;
    await deleteUserById(id);
    return new Response(`user ${id} deleted`);
  },
```

Try sending `DELETE` to `http://localhost:8000/api/users/2` without a body.
We'll get back:

```
user 2 deleted
```

## OPTIONS

Options can be used for some advanced cases, including implementing preflight
request checks for complex CORS use cases. See more on the
[CORS documentation](/docs/examples/dealing-with-cors).

## Full File Reference

<details>
<summary>[id].ts</summary>

```ts
import { Handlers } from "$fresh/server.ts";

type User = {
  id: string;
  name: string;
};

const kv = await Deno.openKv();

export const handler: Handlers<User | null> = {
  async GET(_req, ctx) {
    const id = ctx.params.id;
    const user = await getUserById(id);
    return new Response(JSON.stringify(user));
  },
  async DELETE(_req, ctx) {
    const id = ctx.params.id;
    await deleteUserById(id);
    return new Response(`user ${id} deleted`);
  },
  async PUT(req, ctx) {
    const id = ctx.params.id;
    const body = await req.text();
    const userBody = JSON.parse(body) as User;
    updateUserById(id, userBody);
    return new Response(JSON.stringify(userBody));
  },
};

export async function getUserById(id: string): Promise<User> {
  const key = ["user", id];
  return (await kv.get<User>(key)).value!;
}

export async function deleteUserById(id: string) {
  const userKey = ["user", id];
  const userRes = await kv.get(userKey);
  if (!userRes.value) return;

  const ok = await kv.atomic()
    .check(userRes)
    .delete(userKey)
    .commit();
  if (!ok) throw new Error("Something went wrong.");
}

async function updateUserById(id: string, newUser: User) {
  const userKey = ["user", id];
  const userRes = await kv.get(userKey);
  if (!userRes.value) return;

  const ok = await kv.atomic()
    .check(userRes)
    .set(userKey, newUser)
    .commit();
  if (!ok) throw new Error("Something went wrong.");
}
```

</details>

<details>
<summary>index.ts</summary>

```ts
import { Handlers } from "$fresh/server.ts";

type User = {
  id: string;
  name: string;
};

const kv = await Deno.openKv();

export const handler: Handlers<User | null> = {
  async GET(_req, _ctx) {
    const users = await getAllUsers();
    return new Response(JSON.stringify(users));
  },
  async POST(req, _ctx) {
    const body = await req.text();
    const user = JSON.parse(body) as User;
    await upsertUser(user);
    return new Response(JSON.stringify(user));
  },
};

export async function upsertUser(user: User) {
  const userKey = ["user", user.id];

  const oldUser = await kv.get<User>(userKey);

  if (!oldUser.value) {
    const ok = await kv.atomic()
      .check(oldUser)
      .set(userKey, user)
      .commit();
    if (!ok) throw new Error("Something went wrong.");
  } else {
    const ok = await kv.atomic()
      .check(oldUser)
      .set(userKey, user)
      .commit();
    if (!ok) throw new Error("Something went wrong.");
  }
}

export async function getAllUsers() {
  const users = [];
  for await (const res of kv.list({ prefix: ["user"] })) {
    users.push(res.value);
  }
  return users;
}
```

</details>
