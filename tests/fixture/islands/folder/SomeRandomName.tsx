import useWorker from "../../utils/useWorker.ts";

export default function SomeRandomName() {
  useWorker("../../workers/doStuff.ts");
  return <div>hello from the second island</div>;
}
