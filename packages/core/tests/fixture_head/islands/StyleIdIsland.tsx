import { useEffect, useState } from "preact/hooks";
import { Head } from "fresh/runtime";

export function StyleIdIsland() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <div class={ready ? "ready" : ""}>
      <Head>
        <style id="style-id">ok</style>
      </Head>
    </div>
  );
}
