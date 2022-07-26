import { JSX, options as preactOptions, VNode } from "preact";
import {
  Configuration,
  DarkMode,
  setup as twSetup,
  Sheet,
  ThemeConfiguration,
  tw,
} from "twind";

export const STYLE_ELEMENT_ID = "__FRSH_TWIND";

export interface Options {
  /**
   * Determines the dark mode strategy (default: `"media"`).
   */
  darkMode?: DarkMode;

  /**
   * The twind theme to use.
   */
  theme?: ThemeConfiguration;

  /**
   * ```js
   * {
   *   ':new-variant': '& .selector',
   * }
   * ```
   */
  variants?: Record<string, string>;

  /**
   * Configure wether the class names should be emitted "as is", or if they
   * should be hashed.
   */
  hash?: boolean;
}

declare module "preact" {
  namespace JSX {
    interface DOMAttributes<Target extends EventTarget> {
      class?: string;
      className?: string;
    }
  }
}

export function setup(options: Options, sheet: Sheet) {
  const config: Configuration = {
    darkMode: options.darkMode,
    hash: options.hash,
    mode: "silent",
    sheet,
    variants: options.variants,
    theme: options.theme,
  };
  twSetup(config);

  const originalHook = preactOptions.vnode;
  // deno-lint-ignore no-explicit-any
  preactOptions.vnode = (vnode: VNode<JSX.DOMAttributes<any>>) => {
    if (typeof vnode.type === "string" && typeof vnode.props === "object") {
      const { props } = vnode;
      const classes: string[] = [];
      if (props.class) {
        classes.push(tw(props.class));
        props.class = undefined;
      }
      if (props.className) {
        classes.push(tw(props.className));
      }
      if (classes.length) {
        props.class = classes.join(" ");
      }
    }

    originalHook?.(vnode);
  };
}
