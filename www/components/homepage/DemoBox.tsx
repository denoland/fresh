import { JSX } from "preact";

interface DemoBoxProps extends JSX.HTMLAttributes<HTMLDivElement> {
  flip?: boolean;
}

export function DemoBox(props: DemoBoxProps) {
  const outerFlip = props.flip ? "-skew-y-2 -skew-x-3" : "skew-y-2 skew-x-3";
  const innerFlip = props.flip ? "skew-y-2 skew-x-3" : "-skew-y-2 -skew-x-3";
  return (
    <div
      class={`bg-[linear-gradient(135deg_in_oklch,var(--tw-gradient-stops))] from-yellow-200 via-green-300 to-blue-200 p-8 py-12 text-center items-center flex justify-center ${outerFlip}`}
    >
      <div class={`w-full ${innerFlip}`}>
        {props.children}
      </div>
    </div>
  );
}
