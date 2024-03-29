import IslandConditional from "../islands/IslandConditional.tsx";
import BooleanButton from "../islands/BooleanButton.tsx";
import { signal } from "@preact/signals";

const show = signal(false);

export default function Page() {
  return (
    <div id="page">
      <IslandConditional show={show} />
      <BooleanButton signal={show} />
    </div>
  );
}
