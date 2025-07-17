---
description: |
  Fresh is a full stack modern web framework for JavaScript and TypeScript
  developers, designed to make it trivial to create high-quality, performant,
  and personalized web applications.
---

Fresh is an approchable full stack web framework, designed to make it trivial to
create high-quality, performant, and personalized web applications. You can use
it to create your home page, a blog, a large web application like GitHub or
Twitter, or anything else you can think of.

Fresh is built around the
[island architecture](https://jasonformat.com/islands-architecture/) where every
page is rendered on the server and only the JavaScript for the interactive areas
on your page - so called islands - is shipped to the browser. This allows Fresh
to minimize the amount of JavaScript that is sent to the browser to make your
websites load faster.

Fresh uses [Preact](https://preactjs.com) under the hood, which is a super tiny
react-like framework. Whenever possible, we use standard
[Web APIs](https://developer.mozilla.org/en-US/docs/Web/API) instead of
re-inventing the wheel.

## Project goals

The Fresh project was created and is maintained by the [Deno](https://deno.com/)
company with the goal of beign one of the fastest web frameworks and showing how
Deno can be used to built highly optimized websites. Many experiences gained
here in Fresh directly help making Deno better.
