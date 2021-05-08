import { h, useState } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to `fresh`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter />
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return <div>
    <p>{count}</p>
    <button onClick={() => setCount(count - 1)}>-1</button>
    <button onClick={() => setCount(count + 1)}>+1</button>
  </div>;
}
