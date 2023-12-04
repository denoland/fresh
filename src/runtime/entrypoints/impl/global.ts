import { GLOBAL_SYMBOL_PREFIX } from "$fresh/src/constants.ts"
import type { GlobalScope } from "./globalInit.ts"

export type {
  IslandRegistry,
  RenderRequest,
} from './common.ts';
export type { FreshHistoryState } from './partials.ts'

const globals: GlobalScope = new Proxy({} as any, {
  get(_, name: string) {
    return (window as any)[GLOBAL_SYMBOL_PREFIX + name]
  }
})

export const _walkInner = globals._walkInner
export const NoPartialsError = globals.NoPartialsError
export const fetchPartials = globals.fetchPartials
export const historyState = globals.historyState
export const navigate = globals.navigate
