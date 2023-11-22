import { Fragment, JSX, options as preactOptions, VNode } from "preact";
import {
  BaseTheme,
  setup as twSetup,
  Sheet,
  tw,
  TwindConfig,
} from "../twindv1_deps.ts";

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

const CLASS_ATTR_REG = /[^\w]class="(.+?)"/g;
export function setup<Theme extends BaseTheme = BaseTheme>(
  { selfURL: _selfURL, ...config }: Options<Theme>,
  sheet: Sheet,
) {
  twSetup(config, sheet);

  const tplCache = new Map<string[], string>();

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
    } else if (
      typeof vnode.type === "function" && vnode.type === Fragment &&
      vnode.props !== null && "tpl" in vnode.props
    ) {
      // Patch JSX templates so that only expanded class groups are sent
      // to the browser. While doing so we cache all present classes, so
      // that we can skip this parse step and feed it into twind directly.
      // Case: <div class="foo(bar baz)"> -> <div class="foo-bar foo-baz">
      const tpl = vnode.props.tpl as string[];
      const cached = tplCache.get(tpl);
      if (!cached) {
        let classNames = "";
        for (let i = 0; i < tpl.length; i++) {
          const str = tpl[i];
          if (str === "") continue;

          let start = 0;
          let normalized = "";
          for (const match of str.matchAll(CLASS_ATTR_REG)) {
            const idx = match.index ?? 0;
            if (idx > 0) {
              normalized += str.slice(start, idx);
            }

            classNames += match[1] + " ";
            const replaced = tw(match[1]);
            normalized += `${match[0][0]}class="${replaced}"`;
            start = idx + match[0].length;
          }

          if (start === 0) {
            continue;
          }

          if (start < str.length) {
            normalized += str.slice(start);
          }

          tpl[i] = normalized;
        }

        tplCache.set(tpl, classNames);
      } else {
        tw(cached);
      }
    }

    originalHook?.(vnode);
  };
}
