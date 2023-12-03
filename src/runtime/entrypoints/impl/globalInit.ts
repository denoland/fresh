import { _walkInner, isCommentNode, isElementNode, isTextNode } from "./common.ts"
import { NoPartialsError, PartialComp, applyPartials, fetchPartials } from "./partials.ts"

const GLOBAL_NAME_PREFIX = '__frsh_'

function assignGlobal(name: string, obj: any) {
  (window as any)[GLOBAL_NAME_PREFIX + name] = obj
}

export function getGlobal(name: string) {
  return (window as any)[name]
}

assignGlobal('_walkInner', _walkInner)
assignGlobal('isCommentNode', isCommentNode)
assignGlobal('isElementNode', isElementNode)
assignGlobal('isTextNode', isTextNode)
assignGlobal('NoPartialsError', NoPartialsError)
assignGlobal('PartialComp', PartialComp)
assignGlobal('applyPartials', applyPartials)
assignGlobal('fetchPartials', fetchPartials)
