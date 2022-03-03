/** @jsx h */
import Counter from "../partials/Counter.tsx";
import { h } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to \`fresh\`. Try update this message in the ./pages/index.tsx
        file, and refresh.
      </p>
      <Counter start={5} />
    </div>
  );
}
