/** @type {import('tailwindcss').Config} */
export default {
  content: ["./foo/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pp: "peachpuff",
      },
    },
  },
};
