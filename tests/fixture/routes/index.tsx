/** @jsx h */
import { h } from "preact";
import { IS_BROWSER } from "$fresh/runtime.ts";
import Test from "../islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <Test message="Hello!" />
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}
