import { Fragment, h, options as preactOptions } from "preact";
import {
  assetHashingHook,
  CLIENT_NAV_ATTR,
  type InternalPreactOptions,
  OptionsType,
} from "../shared_internal.tsx";
import { BUILD_ID } from "@fresh/build-id";
import { renderToString } from "preact-render-to-string";
import { useEffect } from "preact/hooks";

// deno-lint-ignore no-explicit-any
const options: InternalPreactOptions = preactOptions as any;

const oldVNodeHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode, BUILD_ID);

  if (typeof vnode.type === "string") {
    if (CLIENT_NAV_ATTR in vnode.props) {
      const value = vnode.props[CLIENT_NAV_ATTR];
      if (typeof value === "boolean") {
        vnode.props[CLIENT_NAV_ATTR] = String(value);
      }
    }
  }

  const originalType = vnode.type;

  if (typeof originalType === "string") {
    switch (originalType) {
      case "title":
      case "meta":
      case "link":
      case "script":
      case "style":
      case "base":
      case "noscript":
      case "template":
        // deno-lint-ignore no-constant-condition
        if (false) {
          // deno-lint-ignore no-explicit-any
          vnode.type = (props: any) => {
            useEffect(() => {
              const text = renderToString(h(Fragment, null, props.children));

              if (originalType === "title") {
                document.title = text;
                return;
              }

              let matched: HTMLElement | null = null;
              if (vnode.key) {
                matched = document.head.querySelector(
                  `head [data-key="${vnode.key}"]`,
                ) as HTMLElement ?? null;
              }

              if (matched === null && props.id) {
                matched = document.head.querySelector(
                  `#${props.name}`,
                ) as HTMLElement ??
                  null;
              }

              if (matched === null) {
                if (originalType === "meta") {
                  matched = document.head.querySelector(
                    `head [name="${props.name}"]`,
                  ) as HTMLElement ?? null;
                } else if (originalType === "base") {
                  matched = document.head.querySelector(originalType) ?? null;
                }
              }

              if (matched === null) {
                matched = document.createElement(originalType as string);
              }

              if (matched.textContent !== text) {
                matched.textContent = text;
              }

              applyProps(props, matched);
            }, []);

            return null;
          };
        }
        break;
    }
  }

  oldVNodeHook?.(vnode);
};

const oldDiff = options[OptionsType.DIFF];
options[OptionsType.DIFF] = (vnode) => {
  oldDiff?.(vnode);
};

// deno-lint-ignore no-explicit-any
function applyProps(props: Record<string, any>, el: HTMLElement) {
  const keys = Object.keys(props);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const value = props[key];

    if (key === "children") {
      continue;
    }

    if (value === null || value === undefined || value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value);
    }
  }
}
