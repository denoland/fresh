import { signal } from "@preact/signals";
import { define } from "../utils.ts";
import { Counter } from "../islands/Counter.tsx";

export default define.page(function IslandInteractive() {
  const sig = signal(3);
  return <Counter count={sig} />;
});
