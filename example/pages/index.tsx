import { h, IS_BROWSER, tw, useState } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p class={tw`text-red-900`}>
        Welcome to `fresh`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter />
      <p>
        {IS_BROWSER
          ? <span class={tw`text-blue-500`}>Viewing browser render.</span>
          : "Viewing JIT render."}
      </p>
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
