import { useEffect, useRef } from "preact/hooks";
import { ComponentChildren } from "preact";

export function FormIsland({ children }: { children: ComponentChildren }) {
  const ref = useRef<HTMLParagraphElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.textContent = "Revived: true";
  }, []);

  return (
    <form onSubmit={(e) => e.preventDefault()}>
      <p class="form-revived" ref={ref}>Revived: false</p>
      {children}
    </form>
  );
}
