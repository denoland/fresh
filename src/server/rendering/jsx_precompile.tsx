import { h, options, VNode } from "preact";
import { RenderState } from "./state.ts";

interface TemplateMeta {
  tpl: string[];
  patchIdxs: number[];
}

const ATTR_REG = /[^\w](href|srcset|src|f-client-nav)(="(\/.+?)"|[^=])/g;
const patchStatusCache = new Map<string[], boolean>();
const tplMeta = new Map<string[], TemplateMeta>();
export function patchJsxTemplate(state: RenderState, tpl: string[]): string[] {
  const needsPatch = patchStatusCache.get(tpl);
  // Nothing to patch, bail out
  if (needsPatch === false) return tpl;

  // First time we're seeing this
  if (needsPatch === undefined) {
    let patch: TemplateMeta | null = null;
    for (let i = 0; i < tpl.length; i++) {
      const str = tpl[i];
      if (str === "") continue;

      ATTR_REG.lastIndex = 0;
      if (ATTR_REG.test(str)) {
        if (patch === null) {
          patch = {
            patchIdxs: [],
            tpl: tpl.slice(),
          };
          patchStatusCache.set(tpl, true);
        }
        patch!.patchIdxs.push(i);
      }
    }
    if (patch === null) {
      patchStatusCache.set(tpl, false);
    } else {
      tplMeta.set(tpl, patch);
    }
  }

  const patch = tplMeta.get(tpl);
  if (patch === undefined) return tpl;

  for (let i = 0; i < patch.patchIdxs.length; i++) {
    const idx = patch.patchIdxs[i];
    const str = tpl[idx];
    patch.tpl[idx] = str.replaceAll(ATTR_REG, (raw, name, _, value) => {
      let suffix = "";
      if (value === undefined) {
        value = true;
        suffix = raw[raw.length - 1];
      }
      // deno-lint-ignore no-explicit-any
      const res = (options as any).attr?.(name, value);
      return typeof res === "string" ? raw[0] + res + suffix : raw;
    });
  }

  return patch.tpl;
}
