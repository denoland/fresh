import { useEffect, useState } from "preact/hooks";

export default function FooBar() {
  const [css, setCss] = useState("");
  useEffect(() => {
    setCss("ready");
  }, []);
  return <h1 class={css}>FooBar island</h1>;
}
