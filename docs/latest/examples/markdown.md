---
description: |
  How to render markdown on your Fresh site.
---

[Markdown](https://www.markdownguide.org/basic-syntax/) is a common text-based
file format that is often used for writing documentation, blogs and more. In
this example we are going convert markdown content to HTML and send it to the
browser.

First, let's install the [`@deno/gfm`](https://jsr.io/@deno/gfm) package that
can transform markdown to html.

1. Run `deno install jsr:@deno/gfm`
2. Create a markdown file like `content/example.md`:

```md content/example.md
## some heading

and some interesting text here

> oh look a blockquote
```

4. Add a route that renders that file

```tsx route/markdown.tsx
// deno-lint-ignore-file react-no-danger
import { define } from "../utils.ts";
import { CSS, render as renderMarkdown } from "@deno/gfm";

export default define.page(async () => {
  const content = await Deno.readTextFile("./content/example.md");
  const html = renderMarkdown(content);

  return (
    <div>
      <h1>Here comes a markdown post:</h1>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
});
```

## More complex examples

For building a full markdown blog see this
[tutorial](https://www.jackfiszr.eu/how-to-build-a-blog-with-fresh-2.0).

For a more elaborate markdown system with Fresh 2 take a look at the
[source code](https://github.com/denoland/fresh/tree/main/www) for this
documentation website.

## Other libraries

There are several other popular libraries besides `@deno/gfm` that can be used
to render markdown. The most common ones are:

- [marked](https://marked.js.org/)
- [remark](https://remark.js.org/)
