import { ClickButton } from "../islands/ClickButton.tsx";

export default function Page() {
  return (
    <div>
      <h1>Island onClick</h1>
      <p id="foo">it doesn't work</p>
      <ClickButton
        onClick={() => document.querySelector("#foo")!.textContent = "it works"}
      >
        click me
      </ClickButton>
    </div>
  );
}
