import { Signal } from "@preact/signals";

export default function SignalProp(props: { sig: Signal<number> }) {
  return (
    <div class="island">
      <p class="output">{props.sig.value}</p>
      <button onClick={() => props.sig.value += 1}>
        update
      </button>
    </div>
  );
}
