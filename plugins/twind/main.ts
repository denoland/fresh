import { Sheet } from "twind";
import { Options, setup, STYLE_ELEMENT_ID } from "./shared.ts";

type State = [Options, string[], [string, string][]];

export default function hydrate(state: State) {
  const el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;
  const rules = new Set(el.innerText.split("\n"));
  const precedences = state[1];
  const mappings = new Map(state[2]
    .map((v) => typeof v === "string" ? [v, v] : v));
  // deno-lint-ignore no-explicit-any
  const sheetState: any[] = [precedences, rules, mappings, true];
  const target = el.sheet!;
  const sheet: Sheet = {
    target,
    insert: (rule, index) => target.insertRule(rule, index),
    init: (cb) => cb(sheetState.shift()),
  };
  setup(state[0], sheet);
}
