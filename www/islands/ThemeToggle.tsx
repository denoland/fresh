import { useEffect, useState } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";

// Use this (e.g. from _app.tsx) in the Head tag like this:
// import {headScript} from "../islands/ThemeToggle.tsx";
// <script src={`data:text/javascript, ${headScript}`}>
export const headScript = `
  document.documentElement.classList.toggle(
    "dark",
    localStorage.theme === "dark" ||
      (!("theme" in localStorage) &&
        window.matchMedia("(prefers-color-scheme: dark)").matches),
);`.replace(/(\n|\t)/g, "").replace(/"/g, "'");

export default function ThemeToggle() {
  const getPreferredTheme = () => {
    if (!IS_BROWSER) return "light";
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) return storedTheme;
    return globalThis.window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  };

  const [theme, setTheme] = useState(getPreferredTheme);

  useEffect(() => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
  };

  return (
    <>
      <button
        type="button"
        onClick={toggleTheme}
        class="dark-mode-toggle button fill-foreground-primary hover:fill-fresh"
        aria-label="Toggle Theme"
      >
        {theme === "light"
          ? (
            <svg
              class="w-6 h-6"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z">
              </path>
            </svg>
          )
          : (
            <svg
              class="w-6 h-6"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1
                  0 100-2H3a1 1 0 000 2h1z"
                fill-rule="evenodd"
                clip-rule="evenodd"
              >
              </path>
            </svg>
          )}
      </button>
    </>
  );
}
