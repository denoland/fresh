export * from "../runtime.ts";
import { IS_BROWSER } from "../runtime.ts";
import { apply, setup, tw } from "https://esm.sh/twind@0.16.16";
import * as colors from "https://esm.sh/twind@0.16.16/colors";
export { apply, setup, tw };
export const theme = {
  colors: {
    blue: colors.blue,
    black: colors.black,
    gray: colors.gray,
    green: colors.green,
    white: colors.white,
    yellow: colors.yellow,
    transparent: "transparent",
  },
};
if (IS_BROWSER) {
  setup({ theme: { colors } });
}
