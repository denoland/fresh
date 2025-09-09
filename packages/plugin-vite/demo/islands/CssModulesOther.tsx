// @ts-ignore upstream issue https://github.com/denoland/deno/issues/30560
import styles from "./CssModulesOther.module.css";

export function CssModulesOther() {
  return (
    <div class="blue">
      <h1 class={styles.root}>blue text</h1>
    </div>
  );
}
