// deno-lint-ignore-file no-process-global
import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export interface EnvIslandProps {
  id?: string;
}

export function EnvIsland(props: EnvIslandProps) {
  const active = useSignal(false);
  useEffect(() => {
    active.value = true;
  }, []);

  const deno = Deno.env.get("FRESH_PUBLIC_TEST_FOO");
  const deno2 = Deno.env.get("FRESH_PUBLIC_TEST_FOO");
  // @ts-ignore f
  const processEnv = process.env.FRESH_PUBLIC_TEST_FOO;

  let denoPrivateEnv = "not ok";
  try {
    Deno.env.get("FRESH_PRIVATE_TEST_FOO");
  } catch {
    denoPrivateEnv = "ok";
  }

  let denoPrivateEnv2 = "not ok";
  try {
    Deno.env.get("FRESH_PRIVATE_TEST_FOO");
  } catch {
    denoPrivateEnv2 = "ok";
  }

  let processEnvPrivate = "not ok";
  try {
    process.env.FRESH_PRIVATE_TEST_FOO;
  } catch {
    processEnvPrivate = "ok";
  }

  return (
    <div id={props.id} class={active.value ? "ready" : ""}>
      <pre class="deno-env">{deno}</pre>
      <pre class="deno-env-2">{deno2}</pre>
      <pre class="process-env">{processEnv}</pre>

      <pre class="deno-env-private">{denoPrivateEnv}</pre>
      <pre class="deno-env-private-2">{denoPrivateEnv2}</pre>
      <pre class="process-env-private">{processEnvPrivate}</pre>
    </div>
  );
}
