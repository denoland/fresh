import { useSignal } from "@preact/signals";

export default function MultipleDefault() {
  const sig = useSignal(0);
  return (
    <div class="island multipledefault">
      <p>MultipleDefault Island: {sig}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}

export function MultipleDefault1() {
  const sig = useSignal(0);
  return (
    <div class="island multipledefault1">
      <p>MultipleDefault1 Island: {sig}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}

export function MultipleDefault2() {
  const sig = useSignal(0);
  return (
    <div class="island multipledefault2">
      <p>MultipleDefault2 Island: {sig}</p>
      <button onClick={() => sig.value += 1}>update</button>
    </div>
  );
}
