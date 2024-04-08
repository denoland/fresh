import { useEffect, useRef } from "preact/hooks";
import { ComponentChildren } from "preact";

export function Fader(props: { children?: ComponentChildren }) {
  const ref = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (ref.current) {
      ref.current.animate([
        { backgroundColor: "white" },
        { backgroundColor: "peachpuff" },
      ], {
        fill: "backwards",
        easing: "ease-out",
        duration: 600,
      });
    }
  });

  return <div ref={ref}>{props.children}</div>;
}
