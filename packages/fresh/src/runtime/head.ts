import { type ComponentChildren, createContext, h } from "preact";

export const HeadContext = createContext(false);

export interface HeadProps {
  children?: ComponentChildren;
}

export function Head(props: HeadProps): ComponentChildren {
  return h(HeadContext, { value: true }, props.children);
}
