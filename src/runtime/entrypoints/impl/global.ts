import type * as partialImpl from "./partials.ts"
import type * as commonImpl from "./common.ts"
import { GLOBAL_SYMBOL_PREFIX } from "$fresh/src/constants.ts"

export type {
  IslandRegistry,
  RenderRequest,
} from './common.ts';
export type { FreshHistoryState } from './partials.ts'

function getGlobal(name: string) {
  return (window as any)[GLOBAL_SYMBOL_PREFIX + name]
}

export const _walkInner = getGlobal('_walkInner') as typeof commonImpl._walkInner
export const NoPartialsError = getGlobal('NoPartialsError') as typeof partialImpl.NoPartialsError
export const historyState = getGlobal('historyState')
export const navigate = getGlobal('navigate') as typeof partialImpl.navigate
export const fetchPartials = getGlobal('fetchPartials') as typeof partialImpl.fetchPartials
