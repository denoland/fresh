import { Signal } from "@preact/signals";

export default function Spinner(props: { id: string; show: Signal<boolean> }) {
  return props.show.value
    ? <p class={`spinner spinner-${props.id}`}>loading...</p>
    : null;
}
