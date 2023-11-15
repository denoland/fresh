import { DATA_ANCESTOR, DATA_CURRENT } from "$fresh/src/constants.ts";
import { matchesUrl, UrlMatchKind } from "../../runtime/active_url.ts";
import { RenderState } from "./state.ts";

interface TemplateMeta {
  tpl: string[];
  patchIdxs: number[];
}

const ANCHOR_REG = /[^\w]href="(\/.+?)"/g;
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

      if (ANCHOR_REG.test(str)) {
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
    patch.tpl[idx] = str.replaceAll(ANCHOR_REG, (raw, value) => {
      const match = matchesUrl(state.url.pathname, value);
      if (match === UrlMatchKind.Current) {
        raw += ` ${DATA_CURRENT}="true" aria-current="page"`;
      } else if (match === UrlMatchKind.Ancestor) {
        raw += ` ${DATA_ANCESTOR}="true" aria-current="true"`;
      }

      return raw;
    });
  }

  return patch.tpl;
}
