import { Signal } from "@preact/signals";

export default function SubmitButton(props: { loading: Signal<boolean> }) {
  if (!window.sigs) window.sigs = [];
  window.sigs.push(props.loading);
  return (
    <span>
      <button type="submit">submit</button>
      {props.loading.value ? "loading..." : null}
    </span>
  );
}
