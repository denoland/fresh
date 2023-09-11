import { IS_BROWSER } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <div>
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}
