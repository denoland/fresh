import { ComponentChildren } from "preact";

interface PassthroughProps {
  children: ComponentChildren;
}

export default function Passthrough({ children }: PassthroughProps) {
  return (
    <div class="pass-through" style="padding: 2rem; border: 2px solid blue">
      <h2>This is an Island</h2>
      <div>{children}</div>
    </div>
  );
}
