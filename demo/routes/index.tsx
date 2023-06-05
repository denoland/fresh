import { useSignal } from "@preact/signals";
import Counter from "../islands/Counter.tsx";
import PassThrough from "../islands/Passthrough.tsx";

export default function Home() {
  const count = useSignal(3);
  return (
    <div>
      <p>
        Welcome to Fresh. Try to update this message in the ./routes/index.tsx
        file, and refresh.
      </p>
      <Counter count={count} />
      <Counter count={count} />
      <Counter count={count} />
      <PassThrough>
        <h1 key="abc">asd test</h1>
      </PassThrough>
    </div>
  );
}
