import { useSignal } from "@preact/signals";

export default function FooIsland() {
  const sig = useSignal(0);
  return (
    <button
      onClick={() => sig.value += 1}
      class="bg-gray-200 py-2 px-4 rounded m-8"
    >
      update {sig}
    </button>
  );
}
