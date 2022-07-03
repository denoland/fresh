---
description: |
  Robustly handle user inputs using HTML `<form>` elements client side, and form
  submission handlers server side.
---

Forms are a common mechanism for letting users interact with applications. In
the last few years it has become more and more common for web applications to
move form submission entirely to the client. This can have useful properties for
interactivity, but it is much worse for resiliency and user experience as a
whole. Browsers have great built in systems for form submission, revolving
around the HTML `<form>` element.

Fresh builds the core of its form submission infrastructure around the native
`<form>` element. This page explains how to use `<form>` in Fresh, and the next
chapter explains how to progressively enhance your forms with client side
JavaScript to make them more interactive.

The way forms work in the browser, is that they perform a HTML navigation action
when the user submits the form. In most cases this means that when the form is
submitted, a GET or POST request is sent to the server with the form data, which
then responds with a new page to render.

Fresh can handle both GET and POST requests through the
[custom handlers][custom-handlers] feature of routes. The handlers can perform
any necessary processing on the form data, and then pass data to the
`ctx.render()` call to render a new page.

Here is an example implementing a search form that filters an array of names
server side:

```tsx
// routes/search.tsx

/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { Handlers, PageProps } from "$fresh/server.ts";

const NAMES = ["Alice", "Bob", "Charlie", "Dave", "Eve", "Frank"];

interface Data {
  results: string[];
  query: string;
}

export const handler: Handlers<Data> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const results = NAMES.filter((name) => name.includes(query));
    return ctx.render({ results, query });
  },
};

export default function Page({ data }: PageProps<Data>) {
  const { results, query } = data;
  return (
    <div class={tw`text-center my-10`}>
      <form class={tw`flex items-center justify-center`}>
        <input
          type="text"
          name="q"
          value={query}
          class={tw`border border-black mx-1`}
        />
        <button type="submit">
          <svg
            class={tw`w-6 h-6`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            >
            </path>
          </svg>
        </button>
      </form>
      <p class={tw`mt-10 text-4xl`}>Result</p>
      <ul class={tw`mt-10 grid grid-cols-1 md:grid-cols-3 mx-20 gap-10`}>
        {results.map((name) => (
          <li class={tw`shadow-lg p-3`} key={name}>{name}</li>
        ))}
      </ul>
    </div>
  );
}
```

When the user submits the form, the browser will navigate to `/search` with the
query set as the `q` query parameter in the URL. The `GET` handler will then
filter the names array based on the query, and pass it to the page component for
rendering.

<!-- TODO(lucacasonato): link to todo app example when that is built again -->

[custom-handlers]: /docs/getting-started/custom-handlers
