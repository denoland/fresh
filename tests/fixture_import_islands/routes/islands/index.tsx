import Counter from "../../islands/Counter.tsx";
import Counter2 from "https://deno.land/x/fresh@1.1.2/tests/fixture/islands/Counter.tsx";
import KebabCaseFileNameTest from "../../islands/kebab_test/kebab-case-counter-test.tsx";
import Test from "../../../shared_islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <Counter id="counter1" start={3} />
      <Counter2 id="counter2" start={10} />
      <KebabCaseFileNameTest id="kebab-case-file-counter" start={5} />
      <Test message="" />
      <Test message={`</script><script>alert('test')</script>`} />
    </div>
  );
}
