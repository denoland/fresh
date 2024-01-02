import { ComponentChildren } from "preact";

export default function IslandSlot(props: { slot?: ComponentChildren }) {
  return (
    <div class="island">
      {props.slot}
    </div>
  );
}
