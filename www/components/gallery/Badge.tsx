import { JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLSpanElement> {
  color: string;
}

export default function Badge(props: Props) {
  return (
    <span
      {...props}
      class={`text-sm font-normal inline-block rounded px-2 ${
        props.color
          ? `text-${props.color}-800 bg-${props.color}-200`
          : "text-green-800 bg-green-200"
      }
      ${props.class ?? ""}`}
    >
      {props.children}
    </span>
  );
}
