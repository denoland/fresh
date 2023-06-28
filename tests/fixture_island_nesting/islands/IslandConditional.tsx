import { Signal } from "@preact/signals";

export interface IslandConditionalProps {
  show: Signal<boolean>;
}

export default function IslandConditional({ show }: IslandConditionalProps) {
  return show.value ? <>it works</> : null;
}
