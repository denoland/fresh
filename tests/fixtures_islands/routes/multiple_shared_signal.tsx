import { signal } from "@preact/signals";
import { define } from "../utils.ts";
import { Counter } from "../islands/Counter.tsx";

export default define.page(function MultipleIslands() {
  const sig = signal(0);
  return (
    <>
      <Counter id="counter-1" count={sig} />
      <Counter id="counter-2" count={sig} />
    </>
  );
});
