import { Config } from "tailwindcss";

export default {
  content: [
    "{routes,islands}/**/*.{ts,tsx}", // deliberately ignore components
  ],
} satisfies Config;
