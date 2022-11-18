import Counter from "../../islands/Counter.tsx";
import KebabCaseFileNameTest from "../../islands/kebab-case-counter-test.tsx";
import Test from "../../islands/Test.tsx";
import Props from "../../islands/Props.tsx";

export default function Home() {
  const u8 = {
    single: new Uint8Array([1, 2, 3]),
    array: [new Uint8Array([1, 2, 3]), new Uint8Array([4, 5])],
  };

  return (
    <div>
      <Counter id="counter1" start={3} />
      <Counter id="counter2" start={10} />
      <KebabCaseFileNameTest id="kebab-case-file-counter" start={5} />
      <Test message="" />
      <Test message={`</script><script>alert('test')</script>`} />
      <Props {...{ u8 }} />
    </div>
  );
}
