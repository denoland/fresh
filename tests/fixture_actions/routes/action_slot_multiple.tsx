import multi1 from "../actions/multi_1.ts";
import multi2 from "../actions/multi_2.ts";
import ActionSlot from "../islands/ActionSlot.tsx";

export default function Page() {
  return (
    <div id="page">
      <ActionSlot>
        <p use={[multi1("multi_1,"), multi2("multi_2")]} />
      </ActionSlot>
    </div>
  );
}
