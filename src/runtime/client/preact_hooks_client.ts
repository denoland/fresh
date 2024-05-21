import { options } from "preact";
import { assetHashingHook } from "../shared_internal.tsx";
import { BUILD_ID } from "../build_id.ts";

const oldVNodeHook = options.vnode;
options.vnode = (vnode) => {
  assetHashingHook(vnode, BUILD_ID);
  oldVNodeHook?.(vnode);
};
