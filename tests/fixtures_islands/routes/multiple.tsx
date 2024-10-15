import { Multiple1, Multiple2 } from "../islands/Multiple.tsx";
import { define } from "../utils.ts";

export default define.page(function MultipleIslands() {
  return (
    <>
      <Multiple1 id="multiple-1" />
      <Multiple2 id="multiple-2" />
    </>
  );
});
