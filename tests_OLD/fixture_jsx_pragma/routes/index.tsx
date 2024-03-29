/** @jsx h */
import type { h } from "preact";
import Island from "../islands/Island.tsx";

export default function Home() {
  return (
    <div>
      <h1>Hello World</h1>
      <Island />
    </div>
  );
}
