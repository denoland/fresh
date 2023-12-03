import { getGlobal } from "./globalInit.ts"
import type * as partialImpl from "./partials.ts"
import type * as commonImpl from "./common.ts"

export type {
  IslandRegistry,
  RenderRequest,
} from './common.ts';

export const _walkInner = getGlobal('_walkInner') as typeof commonImpl._walkInner
export const NoPartialsError = getGlobal('NoPartialsError') as typeof partialImpl.NoPartialsError
export const fetchPartials = getGlobal('fetchPartials') as typeof partialImpl.fetchPartials
