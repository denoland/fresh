---
description: |
  Islands enable client side interactivity in Fresh. They are hydrated on the client in addition to being rendered on the server.
---

Islands enable client side interactivity in Fresh and they are rendered both on
the server and in the client.

Islands are defined by creating a file in the `islands/` folder or a
`(_islands)` folder somewhere in the `routes/` directory. The name of this file
must be a PascalCase or kebab-case name of the island.

```tsx islands/my-island.tsx
import { useSignal } from "@preact/signals";

export default function MyIsland() {
  const count = useSignal(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => (count.value += 1)}>+</button>
    </div>
  );
}
```

An island can be used anywhere like a regular Preact component. Fresh will take
care of making it interactive on the client.

```tsx main.tsx
import MyIsland from "./islands/my-island.tsx";

const app = new App()
  .get("/", (ctx) => ctx.render(<MyIsland />));
```

## Passing props to islands

Passing props to islands is supported, but only if the props are serializable.
Fresh can serialize the following types of values:

- Primitive types `string`, `number`, `boolean`, `bigint`, and `null`
- `Infinity`, `-Infinity`, and `NaN`
- `Uint8Array`
- `Date`
- `RegExp`
- `JSX` Elements
- Plain objects with string keys and serializable values
- Arrays containing serializable values
- Preact Signals (if the inner value is serializable)

Circular references are supported. If an object or signal is referenced multiple
times, it is only serialized once and the references are restored upon
deserialization.

> [warn]: Passing functions to an island is not supported.
>
> ```tsx routes/example.tsx
> export default function () {
>   // WRONG
>   return <MyIsland onClick={() => console.log("hey")} />;
> }
> ```

### Passing JSX

A powerful feature of Fresh is that you can pass server-rendered JSX to an
island via props.

```tsx routes/index.tsx
import MyIsland from "../islands/my-island.tsx";

const app = new App()
  .get("/", (ctx) => {
    return ctx.render(
      <MyIsland jsx={<h1>hello</h1>}>
        <p>This text is rendered on the server</p>
      </MyIsland>,
    );
  });
```

### Nesting islands

Islands can be nested within other islands as well. In that scenario they act
like a normal Preact component, but still receive the serialized props if any
were present.

In essence, Fresh allows you to mix static and interactive parts in your app in
a way that's most optimal for your app. We'll keep sending only the JavaScript
that is needed for the islands to the browser.

```tsx islands/other-island.tsx
export default (props: { foo: string }) => <>{props.foo}</>;
```

```tsx route/index.tsx
import MyIsland from "../islands/my-island.tsx";
import OtherIsland from "../islands/other-island.tsx";

// Later...
<div>
  <MyIsland>
    <OtherIsland foo="this prop will be serialized" />
  </MyIsland>
  <p>Some more server rendered text</p>
</div>;
```

## Rendering islands on client only

When using client-only APIs, like `EventSource` or `navigator.getUserMedia`,
this component will not run on the server as it will produce an error. To fix
this use the `IS_BROWSER` flag as a guard:

```tsx islands/my-island.tsx
import { IS_BROWSER } from "fresh/runtime";

export function MyIsland() {
  // Return any prerenderable JSX here which makes sense for your island
  if (!IS_BROWSER) return <div></div>;

  // All the code which must run in the browser comes here!
  // Like: EventSource, navigator.getUserMedia, etc.
  return <div></div>;
}
```
