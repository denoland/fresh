import { createDefine } from "fresh";

export interface State {
  title?: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export const define = createDefine<State>();
