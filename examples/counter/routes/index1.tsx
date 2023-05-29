/** @jsx h */
import { h } from "preact";
import Counter from "../islands/Counter.tsx";

export default function Home() {
  return (
    <div>
      <p>
        Welcome to Fresh. Try to update this message in the ./routes/index.tsx
        file, and refresh.
      </p>
      <Counter start={3} />
    </div>
  );
}
