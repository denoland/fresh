import Single from "../islands/Single.tsx";
import { Multiple1, Multiple2 } from "../islands/Multiple.tsx";
import MultipleDefault, {
  MultipleDefault1,
  MultipleDefault2,
} from "../islands/MultipleDefault.tsx";

export default function Home() {
  return (
    <div>
      <h2>Single</h2>
      <Single />
      <h2>Multiple</h2>
      <Multiple1 />
      <Multiple2 />
      <h2>Multiple Default</h2>
      <MultipleDefault />
      <MultipleDefault1 />
      <MultipleDefault2 />
    </div>
  );
}
