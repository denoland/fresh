import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function MetaIsland() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : ""}>
      <Head>
        <meta name="foo" content="ok" />
      </Head>
    </div>
  );
}
