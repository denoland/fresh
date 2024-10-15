import { EscapeIsland } from "../islands/EscapeIsland.tsx";
import { define } from "../utils.ts";

export default define.page(function EscapeIslandPage() {
  return <EscapeIsland str={`"foo"asdf`} />;
});
