import { CssModulesNonIsland } from "../components/CssModuleNonIsland.tsx";
// @ts-ignore upstream issue https://github.com/denoland/deno/issues/30560
import styles from "./CssModules.module.css";
import { CssModulesOther } from "./CssModulesOther.tsx";

export function CssModules() {
  return (
    <div class="red">
      <h1 class={styles.root}>red text</h1>
      <CssModulesOther />
      <CssModulesNonIsland />
    </div>
  );
}
