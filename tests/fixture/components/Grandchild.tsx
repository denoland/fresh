import { useProps } from "$fresh/runtime.ts";

export default function Grandchild() {
  const props = useProps();
  if (props.data === "computing this is really hard") {
    return <div>{props.url.toString()}</div>;
  }
  return <div></div>;
}
