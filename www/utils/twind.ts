import { IS_BROWSER } from "$fresh/runtime.ts";
import { apply, setup, tw } from "$twind";
import * as colors from "$twind/colors";
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
