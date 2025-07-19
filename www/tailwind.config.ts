import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin.js";

export default {
  darkMode: ["selector", '[data-theme="dark"]'],
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
        // Dark/light with Tailwind done right using CSS variables:
        "fresh": "hsla(var(--fresh))",
        "fresh-green": "hsla(var(--fresh-green))",

        "background-primary": "hsla(var(--background-primary))",
        "background-secondary": "hsla(var(--background-secondary))",
        "background-tertiary": "hsla(var(--background-tertiary))",
        "foreground-primary": "hsla(var(--foreground-primary))",
        "foreground-secondary": "hsla(var(--foreground-secondary))",
        "foreground-tertiary": "hsla(var(--foreground-tertiary))",
        "foreground-quaternary": "hsla(var(--foreground-quaternary))",

        "info": "hsla(var(--info))",
      },
    },
  },
} satisfies Config;
