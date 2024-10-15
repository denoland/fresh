import { SelfCounter } from "../islands/SelfCounter.tsx";
import { define } from "../utils.ts";

export default define.page(function PreloadPage() {
  return <SelfCounter />;
});
