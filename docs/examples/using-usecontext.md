---
description: |
  A clarification on how useContext can be used in a Fresh project.
---

How can you use `useContext` effectively within a Fresh project? Read on to see
how `useContext` can help you avoid prop drilling, even when working with server
rendered components and islands.

## Simple Example

Let's consider the following case with three files.

`/routes/simple_example.tsx`

```tsx
import { HandlerContext, PageProps } from "$fresh/server.ts";
import { createContext } from "preact";
import { Child } from "../components/Child.tsx";

export const ComplexContext = createContext("");

export const handler = async (
  _req: Request,
  ctx: HandlerContext,
): Promise<Response> => {
  const complexValue = "this is an expensive value to compute";
  return await ctx.render(complexValue);
};

export default function Home(props: PageProps<string>) {
  return (
    <ComplexContext.Provider value={props.data}>
      <Child />
    </ComplexContext.Provider>
  );
}
```

`/components/Child.tsx`

```tsx
import { Grandchild } from "./Grandchild.tsx";

export function Child() {
  return <Grandchild />;
}
```

`/components/Grandchild.tsx`

```tsx
import { ComplexContext } from "../routes/simple_example.tsx";
import { useContext } from "preact/hooks";

export function Grandchild() {
  const value = useContext(ComplexContext);
  return (
    <>
      <div>{value}</div>
    </>
  );
}
```

What we can see here is that an apparently "complexValue" is computed in our
`handler`, and then passed to our root component. We store this value in some
context, and then add our child. Note that the child has no knowledge of the
context or value, and then adds the grandchild. In the grandchild, we extract
the complex value and render it. No prop drilling involved!

When you go to `http://localhost:8000/simple_example` you'll be greeted with a
page that has the content `this is an expensive value to compute`.

## No Island Support

Let's play the same game with islands.

`/routes/island_context_broken.tsx`

```tsx
import { HandlerContext, PageProps } from "$fresh/server.ts";
import { createContext } from "preact";
import IslandChild from "../islands/IslandChild.tsx";

export const ComplexContext = createContext("");

export const handler = async (
  _req: Request,
  ctx: HandlerContext,
): Promise<Response> => {
  const complexValue =
    "this is complex and won't render, because islands don't have access to our ComplexContext";
  return await ctx.render(complexValue);
};

export default function Home(props: PageProps<string>) {
  return (
    <ComplexContext.Provider value={props.data}>
      <IslandChild />
    </ComplexContext.Provider>
  );
}
```

`/islands/IslandChild.tsx`

```tsx
import IslandGrandchild from "./IslandGrandchild.tsx";

export default function IslandChild() {
  return <IslandGrandchild />;
}
```

`/islands/IslandGrandchild.tsx`

```tsx
import { ComplexContext } from "../routes/island_context_broken.tsx";
import { useContext } from "preact/hooks";

export default function IslandGrandchild() {
  const value = useContext(ComplexContext);
  return <div>{value}</div>;
}
```

This is the same basic setup as our previous example. Sadly, when we go to
`http://localhost:8000/island_context_broken`, we receive a blank page. This is
because islands don't have access to our `ComplexContext` that we declared in
the route.

## Workaround for Islands

If you really want to pass the value to the island, then you'll need to extract
it at the last possible moment.

`/routes/context_with_eventual_island.tsx`

```tsx
import { HandlerContext, PageProps } from "$fresh/server.ts";
import { createContext } from "preact";
import { ChildWithGreatGrandchildIsland } from "../components/ChildWithGreatGrandchildIsland.tsx";

export const ComplexContext = createContext("");

export const handler = async (
  _req: Request,
  ctx: HandlerContext,
): Promise<Response> => {
  const complexValue = "this is complex";
  return await ctx.render(complexValue);
};

export default function Home(props: PageProps<string>) {
  return (
    <ComplexContext.Provider value={props.data}>
      <ChildWithGreatGrandchildIsland />
    </ComplexContext.Provider>
  );
}
```

`/components/ChildWithGreatGrandchildIsland.tsx`

```tsx
import { GrandchildWithGreatGrandchildIsland } from "./GrandchildWithGreatGrandchildIsland.tsx";

export function ChildWithGreatGrandchildIsland() {
  return <GrandchildWithGreatGrandchildIsland />;
}
```

`/components/GrandchildWithGreatGrandchildIsland.tsx`

```tsx
import GreatGrandchild from "../islands/GreatGrandchild.tsx";
import { ComplexContext } from "../routes/context_with_eventual_island.tsx";
import { useContext } from "preact/hooks";

export function GrandchildWithGreatGrandchildIsland() {
  const value = useContext(ComplexContext);
  return (
    <>
      <div>{value}</div>
      <GreatGrandchild complexValue={value} />
    </>
  );
}
```

`/islands/GreatGrandchild.tsx`

```tsx
export default function IslandGrandchild(props: { complexValue: string }) {
  return <div>{props.complexValue.toUpperCase()}</div>;
}
```

Here we're able to avoid passing the value through the `Child` and `Grandchild`,
and are able to extract it using `useContext` in the `Grandchild`. Then, once we
have it as a string, we can pass it to our island.

When we go to `http://localhost:8000/context_with_eventual_island` we'll see the
following:

```
this is complex
THIS IS COMPLEX
```

Note that the bold text was rendered client side, since the island is working
correctly.
