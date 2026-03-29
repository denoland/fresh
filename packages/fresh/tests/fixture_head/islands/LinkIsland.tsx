import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function LinkIsland() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : ""}>
      <Head>
        <link rel="canonical" href="https://example.com/ok" />
      </Head>
    </div>
  );
}
