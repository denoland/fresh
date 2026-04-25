import { CssModulesNonIsland } from "../../../components/CssModuleNonIsland.tsx";
import { define } from "../../../utils.ts";

export default define.layout(({ Component }) => {
  return (
    <>
      <CssModulesNonIsland />
      <Component />
    </>
  );
});
