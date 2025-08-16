import mime from "mime-db";
import { useEffect, useState } from "preact/hooks";

export function MimeIsland() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    // deno-lint-ignore no-console
    console.log(mime);
    setReady(true);
  }, []);

  return <h1 class={ready ? "ready" : ""}>mime</h1>;
}
