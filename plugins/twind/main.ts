import { Configuration, setup as twSetup, Sheet, tw } from "twind";
import { JSX, options as preactOptions, VNode } from "preact";
import { Options, STYLE_ELEMENT_ID } from "./shared.ts";

type State = [string, string][];

type PreactOptions = typeof preactOptions & { __b?: (vnode: VNode) => void };

export function setup(options: Options, sheet: Sheet) {
  const config: Configuration = {
    ...options,
    mode: "silent",
    sheet,
  };
  twSetup(config);

  // Hook into options._diff which is called whenever a new comparison
  // starts in Preact.
  const originalHook = (preactOptions as PreactOptions).__b;
  (preactOptions as PreactOptions).__b = (
    // deno-lint-ignore no-explicit-any
    vnode: VNode<JSX.DOMAttributes<any>>,
  ) => {
    if (typeof vnode.type === "string" && typeof vnode.props === "object") {
      const { props } = vnode;
      let classes = "";
      if (props.class) {
        classes += " " + tw(props.class);
        props.class = undefined;
      }
      if (props.className) {
        classes += " " + tw(props.className);
        props.className = undefined;
      }
      if (classes.length) {
        props.class = classes;
      }
    }

    originalHook?.(vnode);
  };
}

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
