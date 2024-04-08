import { useSignal } from "@preact/signals";

export const thisShouldNotCauseProblems = 42;

export function Multiple1() {
  const sig = useSignal(0);
  return (
    <div class="island multiple1">
      <p>Multiple1 Island: {sig}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}

export function Multiple2() {
  const sig = useSignal(0);
  return (
    <div class="island multiple2">
      <p>Multiple2 Island: {sig}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}
