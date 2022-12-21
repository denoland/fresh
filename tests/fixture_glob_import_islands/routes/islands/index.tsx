import Counter from "./Counter.island.tsx";
import Counter2 from "./Counter.island.tsx";
import KebabCaseFileNameTest from "./kebab-case-counter-test.island.tsx";
import Test from "./Test.island.tsx";

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
