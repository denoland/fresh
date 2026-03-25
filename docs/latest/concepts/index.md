---
description: |
  This chapter goes over some fundamental concepts of Fresh.
---

The way Fresh works is that it receives a
[`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request), passes it
through one or more middlewares until one of them responds. This can be an HTML
response, a JSON response or any other response for that matter.

If the response was HTML and contained Islands (=interactive Preact components),
Fresh will boot them up in the browser and execute the relevant JavaScript.

Here is an overview of the basic concepts in Fresh:

- [**App**](/docs/concepts/app) - Holds all the information about your app, like
  routes, etc
- [**Middleware**](/docs/concepts/middleware) - Respond to a request and return
  a `Response`. Used to set headers, or pass state to other middlewares. When a
  middleware doesn't call the next one and returns a response, it's usually
  called a "handler".
- [**Context**](/docs/concepts/context) - Passed through every middleware. Use
  this to share state, trigger redirects or render HTML.
- [**Routes**](/docs/concepts/routing) - Responds to a particular URL and runs
  as chain of middlewares if it matches
- [**Islands**](/docs/concepts/islands) - Render interactive Preact components
  on the client

Advanced concepts:

- [**App wrapper**](/docs/advanced/app-wrapper) - Responsible for the outer HTML
  structure, usually up to the `<body>`-tag
- [**Layouts**](/docs/advanced/layouts) - Re-use a shared layout when calling
  `ctx.render()` across routes
- [**Partials**](/docs/advanced/partials) - Stream in server generated content
  on the current page
