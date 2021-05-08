import { h, PageProps, useState } from "../deps.ts";

export default function Home(props: PageProps) {
  const [counter, setCounter] = useState(0);

  return (
    <div>
      Hello {props.params.name}! {counter}{" "}
      <button onClick={() => setCounter(counter + 1)}>+1</button>
    </div>
  );
}
