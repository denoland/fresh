import { ResolvedFreshConfig } from "../types.ts";

export interface Ctx {
  req: Request;
  url: URL;
  config: ResolvedFreshConfig;
  next(): Promise<Response>;
}
