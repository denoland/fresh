import {
  ComponentChild,
  ComponentChildren,
  createContext,
  Fragment,
  h,
  useContext,
} from "./deps.ts";
import { IS_BROWSER } from "./utils.ts";

export const SUSPENSE_CONTEXT = createContext<ComponentChildren[]>([]);

export interface SuspenseProps {
  fallback: ComponentChild;
  children: ComponentChildren;
}

export function Suspense(props: SuspenseProps) {
  if (IS_BROWSER) {
    throw new Error(`'<Suspense>' is not supported on the client yet.`);
  }

  const suspenseData = useContext(SUSPENSE_CONTEXT);
  const id = suspenseData.push(props.children);

  return h(
    Fragment,
    null,
    h("template", { id: `S:${id}` }),
    props.fallback,
    h("template", { id: `E:${id}` }),
  );
}
