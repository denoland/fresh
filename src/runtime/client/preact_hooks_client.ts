import { options } from "preact";
import { assetHashingHook, CLIENT_NAV_ATTR } from "../shared_internal.tsx";
import { BUILD_ID } from "../build_id.ts";

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

  oldVNodeHook?.(vnode);
};
