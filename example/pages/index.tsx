import { h, IS_BROWSER, useState } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to `fresh`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter />
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}

function Counter() {
  const [count, setCount] = useState(0);
  return <div>
    <p>{count}</p>
    <button onClick={() => setCount(count - 1)} disabled={!IS_BROWSER}>
      -1
    </button>
    <button onClick={() => setCount(count + 1)} disabled={!IS_BROWSER}>
      +1
    </button>
  </div>;
}
