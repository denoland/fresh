---
description: |
  Add components like <title> or <meta> to a <head> tag using Fresh's <Head> component.
---

We can use the `<Head />` component in `$fresh/runtime.ts` to add elements as
children of the `<head>` element. By adding elements as children of Fresh's
`<Head />` tag, these automatically get injected into the `<head>` element of
the web page. Some uses include:

- Setting the document title using `<title>`
- Specifying page metadata using `<meta>`
- Linking to resources like stylesheets using `<link>`
- Including third-party JavaScript code using `<script>`

```tsx routes/index.tsx
import { Head } from "$fresh/runtime.ts";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <meta charset="UTF-8" />
        <title>Fresh App</title>
        <meta
          name="description"
          content="This is a brief description of Fresh"
        />
        <link rel="stylesheet" href="styles.css" />
        <script src="script.js"></script>
      </Head>
      <div class="p-4 mx-auto max-w-screen-md">
        <h1>Hello World</h1>
      </div>
    </>
  );
}
```
