import { useState } from "preact/hooks";

export default function RootFragmentWithConditionalFirst() {
  const [shown, setShown] = useState(false);

  return (
    <>
      {shown && <div>I'm rendered on top</div>}
      Hello
      <div
        onClick={() => setShown(true)}
        id="root-fragment-conditional-first-click-me"
      >
        World
      </div>
    </>
  );
}
