import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function HeadCounter() {
  const [ready, setReady] = useState(false);
  const [v, set] = useState(0);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : "not-ready"}>
      <Head>
        <title>Count: {v}</title>
      </Head>
      <p class="result">Count: {v}</p>
      <button type="button" onClick={() => set((v) => v + 1)}>
        update
      </button>
    </div>
  );
}
