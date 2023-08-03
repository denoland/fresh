import { JSX } from "preact";

interface Props extends JSX.HTMLAttributes<HTMLSpanElement> {
  "data-color": string;
}

export default function Badge(props: Props) {
  return (
    <span
      {...props}
      class={`text-sm font-normal inline-block rounded px-2 ${
        props["data-color"]
          ? `text-${props["data-color"]}-800 bg-${props["data-color"]}-200`
          : "text-green-800 bg-green-200"
      }
      ${props.class ?? ""}`}
    />
  );
}
