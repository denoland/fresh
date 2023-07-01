import { options, VNode as PreactVNode } from "preact";

interface VNode extends PreactVNode {
  __e: (HTMLElement & { _use?: any }) | Text | null;
}

options.vnode = (vnode: VNode) => {
  const props = vnode.props as Record<string, unknown>;
  // Element vnodes with a `use` prop get a `lookupPrefix:[...use]` prop that will be stored on the DOM node:
  //   ^ note: this works because `'lookupPrefix' in el === true`
  if (typeof vnode.type === "string" && props.use) {
    const value = props.use && Array.isArray(props.use)
      ? props.use
      : [props.use];
    props.use = null;
    vnode.__c = value;
  }
};

// after diffing any Element vnode, run use factories/update() methods
options.diffed = (vnode: VNode) => {
  const el = vnode.__e;
  if (typeof vnode.type === "string" && el && vnode.__c) {
    if (el._use) {
      el._use.map((def) => def.result?.update?.(def.params));
    } else {
      el._use = vnode.__c.map((def) => {
        def.result = def.fn(el, def.params);
        return def;
      });
    }
  }
};

options.unmount = (vnode: VNode) => {
  if (typeof vnode.type === "string" && vnode.__e) {
    vnode.__e._use?.map?.((def) => def.result?.destroy?.());
  }
};

export type Action<T = any, E extends HTMLElement = HTMLElement> = (
  element: E,
  params: T,
) => void | { update?(newParams: T): void; destroy?(): void };

export interface ActionDef<T = any> {
  id: number;
  fn: Action<T>;
  params: T;
  result: null | ReturnType<Action<T>>;
}

let id = 0;
export function action<T>(fn: Action<T>) {
  id++;
  return (params: T): ActionDef<T> => ({
    id,
    fn,
    params,
    result: null,
  });
}

declare module "preact" {
  export interface PreactDOMAttributes {
    use?: Action | Action[];
  }
}
