import { Options } from "$fresh/plugins/twind.ts";
import * as colors from "twind/colors";

export default {
  selfURL: import.meta.url,
  theme: {
    colors: {
      blue: colors.blue,
      black: colors.black,
      gray: colors.gray,
      green: colors.green,
      white: colors.white,
      yellow: colors.yellow,
      transparent: "transparent",
    },
  },
  plugins: {
    // Basic workaround for old twind version not supporting
    // the `basis-*` keyword
    "basis": (parts) => {
      let value;
      const arr = parts[0].split("/");
      if (arr.length === 2) {
        value = `${(+arr[0] / +arr[1]) * 100}%`;
      } else if (parts.length === 1) {
        value = parts[0];
      }
      return {
        "flex-basis": value,
      };
    },
  },
} as Options;
