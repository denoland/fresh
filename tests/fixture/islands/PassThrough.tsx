import { ComponentChildren } from "preact";

export interface PassThroughProps {
  children: ComponentChildren;
}

export default function PassThrough({ children }: PassThroughProps) {
  return <div>children: {children}</div>;
}
