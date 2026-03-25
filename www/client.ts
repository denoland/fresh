import "./assets/styles.css";

document.addEventListener("click", async (ev) => {
  let el = ev.target as HTMLElement | null;
  if (el === null) return;
  if (!(el instanceof HTMLButtonElement)) {
    el = el.closest("button");
  }
  if (el === null) return;

  const code = el.dataset.code;
  if (!code) return;

  try {
    await navigator.clipboard.writeText(code);

    el.dataset.copied = "true";

    setTimeout(() => {
      delete el.dataset.copied;
    }, 1000);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    // deno-lint-ignore no-console
    console.error(message || "Copy failed");
  }
});
