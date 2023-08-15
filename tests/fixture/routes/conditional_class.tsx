import { useSignal } from "@preact/signals";

export default function Page() {
  return (
    <div class="foo" class:bob={true}>
    </div>
  );
}
