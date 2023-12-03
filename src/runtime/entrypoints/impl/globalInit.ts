import { GLOBAL_SYMBOL_PREFIX } from "$fresh/src/constants.ts"
import { _walkInner, isCommentNode, isElementNode, isTextNode } from "./common.ts"
import { NoPartialsError, PartialComp, applyPartials, fetchPartials, historyState, navigate } from "./partials.ts"

function assignGlobal(name: string, obj: any) {
  (window as any)[GLOBAL_SYMBOL_PREFIX + name] = obj
}

assignGlobal('_walkInner', _walkInner)
assignGlobal('isCommentNode', isCommentNode)
assignGlobal('isElementNode', isElementNode)
assignGlobal('isTextNode', isTextNode)
assignGlobal('NoPartialsError', NoPartialsError)
assignGlobal('PartialComp', PartialComp)
assignGlobal('applyPartials', applyPartials)
assignGlobal('fetchPartials', fetchPartials)
assignGlobal('historyState', historyState)
assignGlobal('navigate', navigate)