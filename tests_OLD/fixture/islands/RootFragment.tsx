import { useSignal } from "@preact/signals";

export default function RootFragment() {
  const shown = useSignal(false);

  return (
    <>
      Hello
      <div onClick={() => shown.value = true} id="root-fragment-click-me">
        World
      </div>
      {shown.value && <div>I'm rendered now</div>}
    </>
  );
}
