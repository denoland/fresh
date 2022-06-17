/** @jsx h */

import { h } from "$fresh/runtime.ts";
import Counter from "../../islands/Counter.tsx";
import Test from "../../islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <Counter id="counter1" start={3} />
      <Counter id="counter2" start={10} />
      <Test message=""/>
    </div>
  );
}
