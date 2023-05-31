# Modifying Web Page Metadata via the `<Head />` Element

We can use the `<Head />` component in `/runtime.ts` to modify the `<head />`
element. For example by adding changes to the inner components of `<Head />` we
can add new element to the `<head />` component of the display page.

## Common component for modifying `<head />`

- `<title>` Setting the document title
- `<meta>` Specifying metadata
- `<link>` Link external resources
- `<script>` reference JavaScript code

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
        <img
          src="/logo.svg"
          class="w-32 h-32"
          alt="the fresh logo: a sliced lemon dripping with juice"
        />
        <p class="my-6">
          Welcome to `fresh`. Try updating this message in the
          ./routes/index.tsx file, and refresh.
        </p>
        <Counter start={3} />
      </div>
    </>
  );
}
```
