import { ComponentChildren, createContext } from "preact";
import { useContext } from "preact/hooks";

export interface HeadProps {
  children: ComponentChildren;
}

export const HEAD_CONTEXT = createContext<ComponentChildren[]>([]);

export function Head(props: HeadProps) {
  let context: ComponentChildren[];
  try {
    context = useContext(HEAD_CONTEXT);
  } catch (err) {
    throw new Error(
      "<Head> component is not supported in the browser, or during suspense renders.",
      { cause: err },
    );
  }
  context.push(props.children);
  return null;
}
