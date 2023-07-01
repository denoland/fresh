import hello2 from "../actions/hello2.ts";
import ActionSlot from "../islands/ActionSlot.tsx";

export default function Page() {
  return (
    <div id="page">
      <ActionSlot>
        <p use={hello2("it works")}>it doesn't work</p>
      </ActionSlot>
    </div>
  );
}
