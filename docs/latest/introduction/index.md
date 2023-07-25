---
description: |
  Fresh is a full stack modern web framework for JavaScript and TypeScript
  developers, designed to make it trivial to create high-quality, performant,
  and personalized web applications.
---

Fresh is a full stack modern web framework for JavaScript and TypeScript
developers, designed to make it trivial to create high-quality, performant, and
personalized web applications. You can use it to create your home page, a blog,
a large web application like GitHub or Twitter, or anything else you can think
of.

At its core, Fresh is a combination of a routing framework and templating engine
that renders pages on demand, on the server. In addition to this just-in-time
(JIT) rendering on the server, Fresh also provides an interface for seamlessly
rendering some components on the client for maximum interactivity. The framework
uses [Preact][preact] and JSX for rendering and templating on both the server
and the client.

Fresh also does not have a build step. The code you write is also directly the
code that is run on the server, and the code that is executed on the client. Any
necessary transpilation of TypeScript or JSX to plain JavaScript is done on the
fly, just when it is needed. This allows for insanely fast iteration loops and
very very fast deployments.

Fresh projects can be deployed manually to any platform with `deno`, but it is
intended to be deployed to an edge runtime like [Deno Deploy][deno-deploy] for
the best experience.

Some stand out features:

- No build step
- Zero config necessary
- JIT rendering on the edge
- Tiny & fast (no client JS is required by the framework)
- Optional client side hydration of individual components
- Highly resilient because of progressive enhancement and use of native browser
  features
- TypeScript out of the box
- File-system routing à la Next.js

[preact]: https://preactjs.com
[deno-deploy]: https://deno.com/deploy
