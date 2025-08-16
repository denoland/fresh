import { useEffect, useState } from "preact/hooks";

export function EnvIsland() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setReady(true);
  }, []);

  const deno = Deno.env.get("FRESH_PUBLIC_FOO");
  // deno-lint-ignore no-process-global
  const nodeEnv = process.env.FRESH_PUBLIC_FOO;

  return (
    <div class={ready ? "ready" : ""}>
      <pre>{JSON.stringify({ deno,nodeEnv},null,2)}</pre>
    </div>
  );
}
