import { CssModules } from "../../islands/CssModules.tsx";
// @ts-ignore upstream issue https://github.com/denoland/deno/issues/30560
import styles from "./CssRoute.module.css";

export default function Page() {
  return (
    <div>
      <CssModules />
      <div class="route">
        <h1 class={styles.root}>peachpuff text</h1>
      </div>
    </div>
  );
}
