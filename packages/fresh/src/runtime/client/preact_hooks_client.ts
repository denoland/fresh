import { Fragment, h, options as preactOptions, type VNode } from "preact";
import {
  assetHashingHook,
  CLIENT_NAV_ATTR,
  type InternalPreactOptions,
  OptionsType,
} from "../shared_internal.ts";
import { BUILD_ID } from "@fresh/build-id";
import { renderToString } from "preact-render-to-string";
import { useContext, useEffect } from "preact/hooks";
import { HeadContext } from "../head.ts";

// deno-lint-ignore no-explicit-any
const options: InternalPreactOptions = preactOptions as any;

function WrappedHead(
  // deno-lint-ignore no-explicit-any
  { originalType, props, key }: { originalType: string; props: any; key: any },
) {
  const enabled = useContext(HeadContext);

  useEffect(() => {
    if (!enabled) return;

    const text = renderToString(h(Fragment, null, props.children));

    if (originalType === "title") {
      document.title = text;
      return;
    }

    let matched: HTMLElement | null = null;
    if (key) {
      matched = document.head.querySelector(
        `head [data-key="${key}"]`,
      ) as HTMLElement ?? null;
    }

    if (matched === null && props.id) {
      matched = document.head.querySelector(
        `#${props.id}`,
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
      matched = document.createElement(originalType);
    }

    if (matched.textContent !== text) {
      matched.textContent = text;
    }

    applyProps(props, matched);
  }, [originalType, props, key]);

  if (enabled) {
    return null;
  }

  return h(originalType, { ...props, _freshPatched: true });
}

const oldVNodeHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode, BUILD_ID);

  const originalType = vnode.type;
  if (typeof originalType === "string") {
    if (CLIENT_NAV_ATTR in vnode.props) {
      const value = vnode.props[CLIENT_NAV_ATTR];
      if (typeof value === "boolean") {
        vnode.props[CLIENT_NAV_ATTR] = String(value);
      }
      // deno-lint-ignore no-explicit-any
    } else if (!(vnode.props as any)._freshPatched) {
      switch (originalType) {
        case "title":
        case "meta":
        case "link":
        case "script":
        case "style":
        case "base":
        case "noscript":
        case "template": {
          // deno-lint-ignore no-explicit-any
          const v = vnode as VNode<any>;
          const props = vnode.props;
          // deno-lint-ignore no-explicit-any
          delete (props as any)._freshPatched;

          const key = vnode.key;
          v.type = WrappedHead;
          v.props = {
            originalType,
            props,
            key,
          };
          break;
        }
      }
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
