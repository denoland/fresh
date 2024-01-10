import { GLOBAL_SYMBOL_PREFIX } from "$fresh/src/constants.ts"
import { _walkInner } from "./common.ts"
import { NoPartialsError, fetchPartials, historyState, navigate } from "./partials.ts"

const exports = {
  _walkInner,
  NoPartialsError,
  fetchPartials,
  historyState,
  navigate,
} as const

for (const key in exports) {
  (window as any)[GLOBAL_SYMBOL_PREFIX + key] = (exports as any)[key]
}

export type GlobalScope = typeof exports
