/** @jsx h */
import Counter from "../islands/Counter.tsx";
import { h } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to \`fresh\`. Try update this message in the ./routes/index.tsx
        file, and refresh.
      </p>
      <Counter start={5} />
    </div>
  );
}
