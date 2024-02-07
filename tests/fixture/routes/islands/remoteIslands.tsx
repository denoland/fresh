import { useSignal } from "@preact/signals";
import Counter from "https://raw.githubusercontent.com/denoland/fresh/d19c22d5921bdf21de9a7d7bc043b8523ac81893/tests/fixture/islands/Counter.tsx"; //FreshRemoteIsland
import { default as RemoteCounter2 } from "https://deno.land/x/fresh@1.5.2/tests/fixture/islands/folder/Counter.tsx"; //FreshRemoteIsland
import { default as LocalCounter } from "../../islands/Counter.tsx";

export default function remoteIslandRoute() {
  return (
    <>
      <Counter id="remoteCounter1" count={useSignal(13)} />
      <RemoteCounter2 id="remoteCounter2" count={useSignal(37)} />
      <LocalCounter id="localCounter" count={useSignal(42)} />
    </>
  );
}
