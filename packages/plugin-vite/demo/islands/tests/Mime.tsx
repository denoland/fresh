import * as mime from "mime-db";
import { useEffect, useState } from "preact/hooks";

export function MimeIsland() {
  // deno-lint-ignore no-console
  console.log(mime);

  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  return <h1 class={ready ? "ready" : ""}>mime</h1>;
}
