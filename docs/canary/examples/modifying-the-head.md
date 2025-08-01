---
description: |
  Modify <head> content by passing state between AppWrapper/Layout and routes.
---

It's a common requirement for specific pages to need changes to content inside
the `<head>` tag.

- Setting the document title using `<title>`
- Specifying page metadata using `<meta>`
- Linking to resources like stylesheets using `<link>`
- Including third-party JavaScript code using `<script>`

## App Wrapper with State

The recommended way to modify content in `<head>` is to use an app wrapper in
combination with `Context.state`.

### 1. State

The first step can be to define the possible state available on `Context`. In
this example, the `State` is very general to allow very flexible usage.

```ts util.ts
import { createDefine } from "fresh";
import type { JSX } from "preact";

export interface State {
  title?: string;
  metas?: JSX.IntrinsicElements["meta"][];
  links?: JSX.IntrinsicElements["link"][];
  scripts?: JSX.IntrinsicElements["script"][];
}

export const define = createDefine<State>();
```

### 2. App wrapper

After defining the State, create the App Wrapper to render the HTML with the
provided State.

```tsx routes/_app.tsx
import { define } from "../util.ts";

export default define.page(function AppWrapper(ctx) {
  const { title, links, metas, scripts } = ctx.state;

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title ? `${title} | My App` : "My App"}</title>

        {metas?.map((attrs, i) => <meta key={i} {...attrs} />)}
        {links?.map((attrs, i) => <link key={i} {...attrs} />)}
        {scripts?.map((attrs, i) => <script key={i} {...attrs} />)}
      </head>
      <body>
        <ctx.Component />
      </body>
    </html>
  );
});
```

### 3. Route data

Then it's up to each route to update the State with `<head>` data you want to
add for that route. For this to work correctly, the State must be set in a route
handler. Inside the route Component is too late, as it runs after the App
Wrapper.

```tsx routes/index.tsx
import { page } from "fresh";
import { asset } from "fresh/runtime";
import { define } from "../util.ts";

const hero = asset("/hero.webp");

export const handler = define.handlers(({ state: s }) => {
  s.title = "Home";
  s.metas = [{ name: "description", content: "Welcome to the homepage!" }];
  s.links = [
    { rel: "stylesheet", href: asset("/home.css"), type: "text/css" },
    { rel: "preload", href: hero, as: "image", type: "image/webp" },
  ];
  s.scripts = [{ src: "https://example.com/script.js" }];

  return page();
});

export default define.page(function Home() {
  return <img class="hero" src={hero} alt="Hero Image" />;
});
```

If it's very common to add e.g. `title`/`description` to many pages, it can help
a lot to [create State helpers](#state-helper-utility). This can reduce
boilerplate for creating handlers that set metadata on `ctx.state`.

## Using Multiple Layouts

Layouts can be used to use shared `<head>` content for groups of pages. The base
HTML layout can be used as a shared component.

```tsx components/AppWrapper.tsx
import type { RenderableProps } from "preact";
import type { State } from "../util.ts";

export function AppWrapper(props: RenderableProps<State>) {
  const { title, styles, children } = props;
  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />

        <title>{title ? `${title} | My App` : "My App"}</title>

        {styles?.map((url, i) => <link key={i} rel="stylesheet" href={url} />)}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

The component above can then be used by multiple layouts that needs to share the
same `<head>` content.

```tsx routes/docs/_layout.tsx
import { asset } from "fresh/runtime";
import { define } from "../util.ts";
import { AppWrapper } from "../component/AppWrapper.tsx";

export default define.page(function DocsLayout() {
  return (
    <AppWrapper title="Docs" styles={[asset("/docs.css")]}>
      <h1>Welcome to Docs!</h1>
    </AppWrapper>
  );
});
```

```tsx routes/blog/_layout.tsx
import { asset } from "fresh/runtime";
import { define } from "../util.ts";
import { AppWrapper } from "../component/AppWrapper.tsx";

export default define.page(function BlogLayout() {
  return (
    <AppWrapper title="Blog" styles={[asset("/blog.css")]}>
      <h1>My blog</h1>
    </AppWrapper>
  );
});
```

## State helper utility

There's many ways to use abstractions or structure your code when using Fresh.
If many pages needs to set metadata, but otherwise does not require a handler,
it can be handy to create a utility for this.

```ts util.ts
export interface State {
  title?: string;
  description?: string;
}

export const define = createDefine<State>();

export const pageMetadataHandler = (title: string, description?: string) =>
  define.handlers((ctx) => {
    ctx.state.title = title;
    ctx.state.description = description;
  });
```

This helper can reduce boilerplate when creating many routes where each route
needs unique metadata.

```tsx routes/blog.tsx
import { pageMetadataHandler } from "../utils.ts";

export const handlers = pageMetadataHandler("Blog", "Read about ...");
```

```tsx routes/about.tsx
import { pageMetadataHandler } from "../utils.ts";

export const handlers = pageMetadataHandler("About", "Our company ...");
```
