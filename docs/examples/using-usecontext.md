---
description: |
  A clarification on how useContext can be used in a Fresh project.
---

How can you use `useContext` effectively within a Fresh project? Read on to see
how `useContext` can help you avoid prop drilling, even when working with server
rendered components and islands.

## Simple Example

Let's consider the following case with three files.

```tsx
// routes/simple_example.tsx
import { RouteContext } from "$fresh/server.ts";
import { createContext } from "preact";
import { Child } from "../components/Child.tsx";

export const ComplexContext = createContext("");

export default async function Home(req: Request, ctx: RouteContext) {
  const complexValue = await computeComplexValue();
  return (
    <ComplexContext.Provider value={complexValue}>
      <Child />
    </ComplexContext.Provider>
  );
}

async function computeComplexValue() {
  return "this is an expensive value to compute";
}
```

```tsx
// components/Child.tsx
import { Grandchild } from "./Grandchild.tsx";

export function Child() {
  return <Grandchild />;
}
```

```tsx
// components/Grandchild.tsx
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
async server component. We store this value in some context, and then add our
child. Note that the child has no knowledge of the context or value, and then
adds the grandchild. In the grandchild, we extract the complex value and render
it. No prop drilling involved!

When you go to `http://localhost:8000/simple_example` you'll be greeted with a
page that has the content `this is an expensive value to compute`.

## No Island Support

Let's play the same game with islands.

```tsx
// routes/island_context_broken.tsx
import { RouteContext } from "$fresh/server.ts";
import { createContext } from "preact";
import IslandChild from "../islands/IslandChild.tsx";

export const ComplexContext = createContext("");

export default async function Home(req: Request, ctx: RouteContext) {
  const complexValue = await computeComplexValue();
  return (
    <ComplexContext.Provider value={complexValue}>
      <IslandChild />
    </ComplexContext.Provider>
  );
}

async function computeComplexValue() {
  return "this is complex and won't render, because islands don't have access to our useContext";
}
```

```tsx
// islands/IslandChild.tsx
import IslandGrandchild from "./IslandGrandchild.tsx";

export default function IslandChild() {
  return <IslandGrandchild />;
}
```

```tsx
// islands/IslandGrandchild.tsx
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
it at the last possible moment. For variety, we'll use the older `handler`
approach in this example, just to show that this still works as well.

```tsx
// routes/context_with_eventual_island.tsx
import { HandlerContext, PageProps } from "$fresh/server.ts";
import { createContext } from "preact";
import { ChildWithGreatGrandchildIsland } from "../components/ChildWithGreatGrandchildIsland.tsx";

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
      <ChildWithGreatGrandchildIsland />
    </ComplexContext.Provider>
  );
}
```

```tsx
// components/ChildWithGreatGrandchildIsland.tsx
import { GrandchildWithGreatGrandchildIsland } from "./GrandchildWithGreatGrandchildIsland.tsx";

export function ChildWithGreatGrandchildIsland() {
  return <GrandchildWithGreatGrandchildIsland />;
}
```

```tsx
// components/GrandchildWithGreatGrandchildIsland.tsx
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

```tsx
// islands/GreatGrandchild.tsx
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
this is an expensive value to compute
THIS IS AN EXPENSIVE VALUE TO COMPUTE
```

Note that the bold text was rendered client side, since the island is working
correctly.
