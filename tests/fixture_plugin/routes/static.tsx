import { inject } from "../utils/css-inject-plugin.ts";

export default function Home() {
  inject("body { color: red; }");
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}
