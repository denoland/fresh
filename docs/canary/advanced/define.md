---
description: |
  Define helpers are a less TypeScripty way to declare middlewares, routes and layouts
---

Define helpers can be used to shorten the amount of types you have to type
yourself in code. They are entirely optional as some developers prefer the
expliciteness of types, other's like the convenience of `define.*` helpers.

Without define helpers:

```ts util.ts
export interface State {
  foo: string;
}
```

```ts middleware.ts
import type { State } from "./util.ts";

export async function myMiddleware(ctx: Context<State>): Promise<Response> {
  return new Response("hello " + ctx.state.foo);
}

export async function otherMiddleware(ctx: Context<State>): Promise<Response> {
  return new Response("other " + ctx.state.foo);
}
```

With define helpers:

```ts util.ts
// Setup, do this once in a file and import it everywhere else.
export const define = createDefine<{ foo: string }>();
```

```ts middleware.ts
import { define } from "./util.ts";

// Usage
export const myMiddleware = define.middleware((ctx) => {
  return new Response("hello " + ctx.state.foo);
});

export const otherMiddleware = define.middleware((ctx) => {
  return new Response("other " + ctx.state.foo);
});
```

## File routes

The `define.*` helpers include a `define.handler()` and `define.page()` function
to make it easy for TypeScript to establish a relation between the two. That way
when you can pass data from the handler to the component in a type-safe way.

```tsx routes/index.tsx
export const handler = define.handlers({
  GET(ctx) {
    return { data: { foo: "Deno" } };
  },
});

// When you type `props.data.*` you'll get autocompletion
export default define.page<typeof handler>((props) => {
  return (
    <div>
      <h1>I like {props.data.foo}</h1>
    </div>
  );
});
```
