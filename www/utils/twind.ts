export * from "twind";

import { IS_BROWSER } from "$fresh/runtime.ts";
import * as colors from "twind/colors";
import { setup } from "twind";

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
