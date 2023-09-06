import { ClickButton } from "../islands/ClickButton.tsx";
import { useSignal } from "@preact/signals";

export default function Page() {
  const sig = useSignal(0);
  return (
    <div>
      <h1>Island onClick</h1>
      <p>{sig}</p>
      <ClickButton onClick={() => sig.value++}>click me</ClickButton>
    </div>
  );
}
