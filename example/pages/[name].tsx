import { h } from "../deps.ts";

interface Props {
  params: {
    name: string;
  };
}

export default function Greet(props: Props) {
  return <div>Hello {props.params.name}</div>;
}
