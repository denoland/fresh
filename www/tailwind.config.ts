import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin.js";

export default {
  content: [
    "{routes,islands,components}/**/*.{ts,tsx}",
  ],
  plugins: [
    plugin((api) => {
      api.addUtilities({
        ".form-select-bg": {
          "background-image":
            `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239fa6b2' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e")`,
          "background-position": "right 0.5rem center",
          "background-size": "1.5em 1.5em",
          "background-repeat": "no-repeat",
        },
      });
    }),
  ],
  theme: {
    extend: {
      colors: {
        // use RGB variables with alpha value
        "fresh": "rgb(var(--fresh-rgb) / <alpha-value>)",
        "fresh-green": "rgb(var(--fresh-green-rgb) / <alpha-value>)",

        "background-primary":
          "rgb(var(--background-primary-rgb) / <alpha-value>)",
        "background-secondary":
          "rgb(var(--background-secondary-rgb) / <alpha-value>)",
        "background-tertiary":
          "rgb(var(--background-tertiary-rgb) / <alpha-value>)",
        "foreground-primary":
          "rgb(var(--foreground-primary-rgb) / <alpha-value>)",
        "foreground-secondary":
          "rgb(var(--foreground-secondary-rgb) / <alpha-value>)",
        "foreground-tertiary":
          "rgb(var(--foreground-tertiary-rgb) / <alpha-value>)",
        "foreground-quaternary":
          "rgb(var(--foreground-quaternary-rgb) / <alpha-value>)",

        "info": "rgb(var(--info-rgb) / <alpha-value>)",
      },
    },
  },
} satisfies Config;
