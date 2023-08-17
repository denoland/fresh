---
description: |
  Robustly handle user inputs using HTML `<form>` elements client side, and form
  submission handlers server side.
---

For stronger resiliency and user experience, Fresh relies on native browser
support for form submissions with the HTML `<form>` element.

In the browser, a `<form>` submit will send an HTML action (usually `GET` or
`POST`) to the server, which responds with a new page to render.

## POST request with `multipart/form-data`

Forms can either submit as a `GET` request with URL search parameter encoding,
or as a `POST` request with `multipart/form-data`.

This example demonstrates how to handle `multipart/form-data` `<form>`
submissions:

```tsx routes/subscribe.tsx
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    return await ctx.render();
  },
  async POST(req, ctx) {
    const form = await req.formData();
    const email = form.get("email")?.toString();

    // Add email to list.

    // Redirect user to thank you page.
    const headers = new Headers();
    headers.set("location", "/thanks-for-subscribing");
    return new Response(null, {
      status: 303, // See Other
      headers,
    });
  },
};

export default function Subscribe() {
  return (
    <>
      <form method="post">
        <input type="email" name="email" value="" />
        <button type="submit">Subscribe</button>
      </form>
    </>
  );
}
```

When the user submits the form, Deno will access a specific `email` value from a
`formData()`, add the email to a list, and redirect the user to a thank you
page.
