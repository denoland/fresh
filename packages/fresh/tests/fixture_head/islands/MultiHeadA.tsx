import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function MultiHeadA() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready-a" : ""}>
      <Head>
        <title>from island A</title>
        <meta name="author" content="island-a" />
      </Head>
    </div>
  );
}
