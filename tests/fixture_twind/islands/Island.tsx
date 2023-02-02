import { IS_BROWSER } from "../../../src/runtime/utils.ts";
import { useState } from "preact/hooks";

export default function Island() {
  const id = IS_BROWSER ? "csr" : "ssr";
  const [count, setCount] = useState(0);

  return (
    <div>
      <button
        id={id}
        class={"" + (count > 0 ? "text-red-500" : "")}
        onClick={() => setCount(count + 1)}
      >
        Count = {count}
      </button>
    </div>
  );
}
