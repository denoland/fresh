import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function DynamicMetaIsland() {
  const [count, setCount] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : ""}>
      <Head>
        <meta name="foo" content={`value-${count}`} />
      </Head>
      <button type="button" onClick={() => setCount((v) => v + 1)}>
        update
      </button>
    </div>
  );
}
