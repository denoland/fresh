import { Partial } from "@fresh/core/runtime";
import { ReadyIsland } from "../../islands/tests/Ready.tsx";

export default function Page() {
  return (
    <div f-client-nav>
      <h1>Partial</h1>
      <Partial name="partial-test">
        <a href="/tests/partial_insert">click me</a>
      </Partial>
      <ReadyIsland />
    </div>
  );
}
