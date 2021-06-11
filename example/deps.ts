export * from "../runtime.ts";
import { IS_BROWSER } from "../runtime.ts";
import { setup, tw } from "https://esm.sh/twind";
export { setup, tw };
if (IS_BROWSER) {
  setup({});
}
