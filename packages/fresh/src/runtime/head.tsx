import { type ComponentChildren, createContext } from "preact";

export const HeadContext = createContext(false);

export interface HeadProps {
  children?: ComponentChildren;
}

export function Head(props: HeadProps): ComponentChildren {
  return <HeadContext value>{props.children}</HeadContext>;
}
