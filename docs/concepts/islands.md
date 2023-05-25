---
description: |
  Islands enable client side interactivity in Fresh. They are hydrated on the client in addition to being rendered on the server.
---

Islands enable client side interactivity in Fresh. Islands are isolated Preact
components that are rendered on the client. This is different from all other
components in Fresh, as they are usually just rendered on the server.

Islands are defined by creating a file in the `islands/` folder in a Fresh
project. The name of this file must be a PascalCase or kebab-case name of the
island. The file must have a default export that is a regular Preact component.

```tsx
// islands/MyIsland.tsx

import { useState } from "preact/hooks";

export default function MyIsland() {
  const [count, setCount] = useState(0);

  return (
    <div>
      Counter is at {count}.{" "}
      <button onClick={() => setCount(count + 1)}>+</button>
    </div>
  );
}
```

An island can be used in a page like a regular Preact component. Fresh will take
care of automatically re-hydrating the island on the client.

Passing props to islands is supported, but only if the props are JSON
serializable. This means that you can only pass:

- Primitive types `string`, `boolean`, and `null`
- Most `number`s (`Infinity`, `-Infinity`, and `NaN` are silently converted to
  `null`, and `bigint`s are not supported)
- Plain objects with string keys and primitive, plain object, or array values
- Arrays containing primitives, plain objects, or other arrays

It is currently not possible to pass complex objects like `Date`, custom
classes, or functions. This means that it is not possible to pass `children` to
an island, as `children` are VNodes, which are not serializable. To find out
more about JSON serializable values, check out
[how `JSON.stringify()` works](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#description).

It is also not supported to nest islands within other islands.
