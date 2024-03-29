import { IS_BROWSER } from "@fresh/runtime";
import Test from "../islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <Test message="Hello!" />
      <p>Env: {IS_BROWSER ? "browser" : "server"}</p>
    </div>
  );
}
