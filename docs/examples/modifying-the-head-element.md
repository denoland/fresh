---
description: |
  By adding inner components to Fresh's head element, we add inner components to the HTML head element of the web page.
---

We can use the `<Head />` component in `$fresh/runtime.ts` to modify the
`<head>` element. By adding inner components to `<Head />`, we add inner
components to the `<head>` element of the web page. Some uses include:

- Setting the document title using `<title>`
- Specifying page metadata using `<meta>`
- Linking to external resources using `<link>`
- Including JavaScript code using `<script>`

```tsx
// routes/index.tsx
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
