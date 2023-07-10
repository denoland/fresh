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
    basis: (parts) => {
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
    "rounded-full": () => {
      return {
        "border-radius": "9999px",
      };
    },
    "form-select-bg": () => {
      return {
        "background-image":
          `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239fa6b2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
        "background-position": "right 0.5rem center",
        "background-size": "1.5em 1.5em",
        "background-repeat": "no-repeat",
      };
    },
    "grow": () => {
      return {
        "flex-grow": "1",
      };
    },
  },
} as Options;
