/** @jsx h */

import { h } from "../../client_deps.ts";
import Counter from "../../islands/Counter.tsx";
import Outer from "../../islands/Outer.tsx";

export default function Home() {
  return (
    <div>
      <Counter id="counter1" start={3} />
      <Counter id="counter2" start={10} />
      <Outer id="outer1" start={100} />
    </div>
  );
}
