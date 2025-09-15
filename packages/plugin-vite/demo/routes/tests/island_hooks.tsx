import { Foo2 } from "../../islands/Foo2.tsx";
import { CounterHooks } from "../../islands/tests/CounterHooks.tsx";

export default function Page() {
  return (
    <div>
      <CounterHooks />
      <Foo2 />
    </div>
  );
}
