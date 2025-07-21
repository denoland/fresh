---
description: "Create re-usable layouts across routes"
---

Layouts are plain Preact components that are inherited based on the matching
pattern. When you have a section on your site where all pages share the same
HTML structure and only the content changes, a layout is a neat way to abstract
this. Layouts only ever render on the server. The passed `Component` value
represents the children of this component.

```tsx
function PageLayout({ Component }) {
  return (
    <div>
      <Component />
      <aside>Here is some sidebar content</aside>
    </div>
  );
}

const app = new App()
  .layout("*", PageLayout)
  .get("/", (ctx) => ctx.render(<h1>hello</h1>));
```

If you browse to the `/` route, Fresh will render the following HTML

```html
<div>
  <h1>hello world</h1>
  <aside>Here is some sidebar content</aside>
</div>
```

## Options

Add a layout and ignore all previously inherited ones.

```ts
app.layout("/foo/bar", MyComponent, { skipInheritedLayouts: true });
```

Ignore the app wrapper component:

```ts
app.layout("/foo/bar", MyComponent, { skipAppWrapper: true });
```
