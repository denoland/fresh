---
title: What's next for Fresh
description: Some thoughts from Luca on what is next for Fresh.
date: 2026-10-17
authors:
  - Luca Casonato
image: /blog/fresh-next/header.png
draft: true
---

Hey! Since the recent acquisition of Deno by Cloudflare, I have gotten a huge number of questions from people about what this means for Fresh.

Marvin and I (the maintainers of Fresh) both departed the Deno company in March 2026, before the acquisition. Shortly thereafter, I asked Ryan to transfer the Fresh project into a new organization where it could be maintained independently of Deno. In May the Fresh repo moved to https://github.com/freshframework, and the website moved to a new domain: https://usefresh.dev.

But other than that nothing much changed on the surface! Under the hood however, I have been working on and off on Fresh 3. The next major version of Fresh will be better than Fresh 2 in every possible way: faster, simpler, more capable, and importantly: runtime agnostic. Fresh 3 sites will be able to run on Node, Deno, Bun, Cloudflare Workers, or any other runtime you can think of. This is enabled by full switch to [Vite](https://vite.dev) and [Nitro](https://nitro.build).

A plethora of new features are also coming to Fresh 3, primarially focussed on islands and state sharing. You'll be able to register event listers like `onClick` or `onHover` directly in routes, even outside of islands. Unlike in other frameworks like Next.js, this does not cause the entire page's (or component's) JS code to be shipped to the client. Instead, only the function is serialized to the client.

I'll be announcing more on this soon. For now, you can try the new version of Fresh here: https://next.usefresh.dev

\- Luca
