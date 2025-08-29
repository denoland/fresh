// @ts-ignore upstream issue https://github.com/denoland/deno/issues/30560
import styles from "./CssModules.module.css";

export function CssModules() {
  return <h1 class={styles.root}>red text</h1>;
}
