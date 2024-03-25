interface Props {
  params: Record<string, string | string[]>;
}

export default function Lang(props: Props) {
  return props.params.lang
    ? <div>Hello {props.params.lang}</div>
    : <div>Hello</div>;
}
