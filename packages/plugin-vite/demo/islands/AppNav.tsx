// @ts-ignore upstream issue https://github.com/denoland/deno/issues/30560
import styles from "./AppNav.module.css";

export function AppNav() {
  return (
    <nav class={`app-nav ${styles.nav}`}>
      <span>Fresh</span>
    </nav>
  );
}
