import { GLOBAL_SYMBOL_PREFIX } from "$fresh/src/constants.ts"
import { _walkInner } from "./common.ts"
import { NoPartialsError, fetchPartials, historyState, navigate } from "./partials.ts"

function assignGlobal(name: string, obj: any) {
  (window as any)[GLOBAL_SYMBOL_PREFIX + name] = obj
}

assignGlobal('_walkInner', _walkInner)
assignGlobal('NoPartialsError', NoPartialsError)
assignGlobal('fetchPartials', fetchPartials)
assignGlobal('historyState', historyState)
assignGlobal('navigate', navigate)
