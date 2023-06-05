import { type ComponentChildren } from "preact";

interface PassThroughProps {
  children: ComponentChildren;
}

export default function PassThrough({ children }: PassThroughProps) {
  return <div>children: {children}</div>;
}
