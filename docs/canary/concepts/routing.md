---
description: |
  File based routing is the simplest way to do routing in Fresh apps. Additionally custom patterns can be configured per route.
---

Routing defines which middlewares and routes should respond to a particular
request.

```ts
const app = new App()
  .get("/", () => new Response("hello")) // Responds to: GET /
  .get("/other", () => new Response("other")) // Responds to: GET /other
  .post("/upload", () => new Response("upload")); // Responds to: POST /upload
  .get("/books/:id", (ctx) => {
    // Responds to: GET /books/my-book, /books/cool-book, etc
    const id = ctx.params.id
    return new Response(`Book id: ${id}`));
  })
  .get("/blog/:post/comments", () => {
    // Responds to: GET /blog/my-post/comments, /blog/hello/comments, etc
    const post = ctx.params.post
    return new Response(`Blog post comments for post: ${post}`)
  })
  .get("/foo/*", (ctx) => {
    // Responds to: GET /foo/bar, /foo/bar/baz, etc
    return new Response("foo"));
  })
```

Fresh supports the full
[`URLPattern`](https://developer.mozilla.org/en-US/docs/Web/API/URL_Pattern_API)
syntax for setting pathnames.
