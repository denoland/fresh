import { Sheet } from "twind";
import { Options, setup, STYLE_ELEMENT_ID } from "./shared.ts";

type State = [string, string][];

export default function hydrate(options: Options, state: State) {
  const el = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement;
  const rules = new Set<string>();
  const precedences: number[] = [];
  const mappings = new Map(
    state.map((v) => typeof v === "string" ? [v, v] : v),
  );
  // deno-lint-ignore no-explicit-any
  const sheetState: any[] = [precedences, rules, mappings, true];
  const target = el.sheet!;
  const ruleText = Array.from(target.cssRules).map((r) => r.cssText);
  for (const r of ruleText) {
    const m = r.lastIndexOf("/*");
    const precedence = parseInt(r.slice(m + 2, -2), 36);
    const rule = r.slice(0, m);
    rules.add(rule);
    precedences.push(precedence);
  }
  const sheet: Sheet = {
    target,
    insert: (rule, index) => target.insertRule(rule, index),
    init: (cb) => cb(sheetState.shift()),
  };
  setup(options, sheet);
}
