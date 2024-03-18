import { JSX, options as preactOptions, VNode } from "preact";
import {
  BaseTheme,
  setup as twSetup,
  Sheet,
  tw,
  TwindConfig,
} from "$fresh/plugins/twindv1_deps.ts";

type PreactOptions = typeof preactOptions & { __b?: (vnode: VNode) => void };

export const STYLE_ELEMENT_ID = "__FRSH_TWIND";

export interface Options<Theme extends BaseTheme = BaseTheme>
  extends TwindConfig<Theme> {
  /** The import.meta.url of the module defining these options. */
  selfURL: string;
}

declare module "preact" {
  namespace JSX {
    interface DOMAttributes<Target extends EventTarget> {
      class?: string;
      className?: string;
    }
  }
}

export function setup<Theme extends BaseTheme = BaseTheme>(
  { selfURL: _selfURL, ...config }: Options<Theme>,
  sheet: Sheet,
) {
  twSetup(config, sheet);

  // Hook into options._diff which is called whenever a new comparison
  // starts in Preact.
  const originalHook = (preactOptions as PreactOptions).__b;
  (preactOptions as PreactOptions).__b = (
    // deno-lint-ignore no-explicit-any
    vnode: VNode<JSX.DOMAttributes<any>>,
  ) => {
    if (typeof vnode.type === "string" && typeof vnode.props === "object") {
      const { props } = vnode;
      const classes: string[] = [];
      if (props.class) {
        classes.push(tw(props.class));
        props.class = undefined;
      }
      if (props.className) {
        classes.push(tw(props.className));
        props.className = undefined;
      }
      if (classes.length) {
        props.class = classes.join(" ");
      }
    }

    originalHook?.(vnode);
  };
}
