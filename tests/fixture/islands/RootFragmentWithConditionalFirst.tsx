import { useSignal } from "@preact/signals";

export default function RootFragmentWithConditionalFirst() {
  const shown = useSignal(false);

  return (
    <>
      {shown.value && <div>I'm rendered on top</div>}
      Hello
      <div
        onClick={() => shown.value = true}
        id="root-fragment-conditional-first-click-me"
      >
        World
      </div>
    </>
  );
}
