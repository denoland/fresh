import IslandConditional from "../islands/IslandConditional.tsx";
import BooleanButton from "../islands/BooleanButton.tsx";
import { signal } from "@preact/signals";

const show = signal(true);

export default function Page() {
  return (
    <div id="page">
      <IslandConditional show={show}>
        <p>server rendered</p>
      </IslandConditional>
      <BooleanButton signal={show} />
    </div>
  );
}
