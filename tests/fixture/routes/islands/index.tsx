import { useSignal } from "@preact/signals";
import Counter from "../../islands/Counter.tsx";
import FolderCounter from "../../islands/folder/Counter.tsx";
import SubfolderCounter from "../../islands/folder/subfolder/Counter.tsx";
import KebabCaseFileNameTest from "../../islands/kebab-case-counter-test.tsx";
import Test from "../../islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <Counter id="counter1" count={useSignal(3)} />
      <Counter id="counter2" count={useSignal(10)} />
      <FolderCounter id="folder-counter" count={useSignal(3)} />
      <SubfolderCounter id="subfolder-counter" count={useSignal(3)} />
      <KebabCaseFileNameTest
        id="kebab-case-file-counter"
        count={useSignal(5)}
      />
      <Test message="" />
      <Test message={`</script><script>alert('test')</script>`} />
    </div>
  );
}
