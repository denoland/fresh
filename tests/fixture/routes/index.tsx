/** @jsx h */

import { h, IS_BROWSER } from "../deps.client.ts";
import Test from "../islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <Test message="Hello!" />
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}
