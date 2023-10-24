export default function Counter(props: { text?: string }) {
  const text = props.text ?? "check output";
  return <h1>{text}</h1>;
}
