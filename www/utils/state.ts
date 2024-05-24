import { createDefine } from "@fresh/core";

export interface State {
  title?: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
}

export const df = createDefine<State>();
