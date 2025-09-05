import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function HeadMeta() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : "not-ready"}>
      <Head>
        <meta name="custom" content="ok" />
        <meta name="custom-new" content="ok" />
      </Head>
      <h1>check meta</h1>
    </div>
  );
}
