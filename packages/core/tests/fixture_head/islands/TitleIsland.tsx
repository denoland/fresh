import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function TitleIsland() {
  const [s, set] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : ""}>
      <Head>
        <title>Count: {s}</title>
      </Head>
      <button type="button" onClick={() => set((v) => v + 1)}>
        update {s}
      </button>
    </div>
  );
}
