import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";
import { useSignal } from "@preact/signals";

// This island initializes copy buttons for all code blocks on the page
export default function CodeCopyButton() {
  const copiedStates = useSignal<{ [key: string]: boolean }>({});

  async function handleCopy(code: string, blockId: string) {
    if (!code) return;

    try {
      await navigator.clipboard.writeText(code);
      copiedStates.value = { ...copiedStates.value, [blockId]: true };

      // Reset after 2 seconds
      setTimeout(() => {
        copiedStates.value = { ...copiedStates.value, [blockId]: false };
      }, 2000);
    } catch (error) {
      // deno-lint-ignore no-console
      console.error("Copy failed:", error);
    }
  }

  function createCopyButton(
    codeText: string,
    language: string,
    blockId: string,
    copied: boolean,
  ) {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute(
      "aria-label",
      `Copy ${language || "code"} to clipboard`,
    );
    button.disabled = !IS_BROWSER;
    button.className =
      `rounded p-1.5 border transition-colors backdrop-blur-sm ${
        copied
          ? "text-green-600 border-green-400 bg-green-50/90"
          : "text-gray-600 border-gray-300 bg-white/90 hover:bg-gray-50/90"
      }`;

    // Create the icon
    const icon = document.createElement("div");
    icon.innerHTML = copied
      ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>'
      : '<svg class="h-4 w-4" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.55566 2.7C1.55566 2.03726 2.09292 1.5 2.75566 1.5H8.75566C9.41841 1.5 9.95566 2.03726 9.95566 2.7V5.1H12.3557C13.0184 5.1 13.5557 5.63726 13.5557 6.3V12.3C13.5557 12.9627 13.0184 13.5 12.3557 13.5H6.35566C5.69292 13.5 5.15566 12.9627 5.15566 12.3V9.9H2.75566C2.09292 9.9 1.55566 9.36274 1.55566 8.7V2.7ZM6.35566 9.9V12.3H12.3557V6.3H9.95566V8.7C9.95566 9.36274 9.41841 9.9 8.75566 9.9H6.35566ZM8.75566 8.7V2.7L2.75566 2.7V8.7H8.75566Z" fill="currentColor" /></svg>';

    button.appendChild(icon);

    button.addEventListener("click", () => {
      handleCopy(codeText, blockId);
    });

    return button;
  }

  function createTooltip(copied: boolean) {
    const tooltip = document.createElement("div");
    tooltip.className =
      `absolute pointer-events-none bg-gray-900 text-white text-sm px-2 py-1 rounded -top-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-200 z-10 ${
        copied ? "opacity-100" : "opacity-0"
      }`;
    tooltip.textContent = "Copied!";
    return tooltip;
  }

  useEffect(() => {
    if (!IS_BROWSER) return;

    // Find all code blocks and add copy buttons
    const codeBlocks = document.querySelectorAll(
      ".fenced-code[data-code-text]",
    );

    codeBlocks.forEach((block, index) => {
      const codeText = block.getAttribute("data-code-text");
      const language = block.getAttribute("data-code-lang") || "";

      if (!codeText) return;

      const blockId = `code-block-${index}`;

      // Skip if button already exists
      if (block.querySelector(".copy-button-container")) return;

      // Create a container for the copy button
      const buttonContainer = document.createElement("div");
      buttonContainer.className =
        "copy-button-container absolute top-3 right-3";

      const tooltip = createTooltip(false);
      const button = createCopyButton(codeText, language, blockId, false);

      buttonContainer.appendChild(tooltip);
      buttonContainer.appendChild(button);

      // Add the button container to the code block
      block.appendChild(buttonContainer);
    });
  }, []);

  useEffect(() => {
    // Update button states when copied states change
    if (!IS_BROWSER) return;

    const containers = document.querySelectorAll(".copy-button-container");
    containers.forEach((container, index) => {
      const block = container.parentElement;
      if (!block) return;

      const codeText = block.getAttribute("data-code-text");
      const _language = block.getAttribute("data-code-lang") || "";
      const blockId = `code-block-${index}`;

      if (!codeText) return;

      const copied = copiedStates.value[blockId] || false;

      // Update tooltip
      const tooltip = container.querySelector("div");
      if (tooltip) {
        tooltip.className =
          `absolute pointer-events-none bg-gray-900 text-white text-sm px-2 py-1 rounded -top-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-200 z-10 ${
            copied ? "opacity-100" : "opacity-0"
          }`;
      }

      // Update button
      const button = container.querySelector("button") as HTMLButtonElement;
      if (button) {
        button.className =
          `rounded p-1.5 border transition-colors backdrop-blur-sm ${
            copied
              ? "text-green-600 border-green-400 bg-green-50/90"
              : "text-gray-600 border-gray-300 bg-white/90 hover:bg-gray-50/90"
          }`;

        // Update icon
        const iconContainer = button.querySelector("div");
        if (iconContainer) {
          iconContainer.innerHTML = copied
            ? '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>'
            : '<svg class="h-4 w-4" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M1.55566 2.7C1.55566 2.03726 2.09292 1.5 2.75566 1.5H8.75566C9.41841 1.5 9.95566 2.03726 9.95566 2.7V5.1H12.3557C13.0184 5.1 13.5557 5.63726 13.5557 6.3V12.3C13.5557 12.9627 13.0184 13.5 12.3557 13.5H6.35566C5.69292 13.5 5.15566 12.9627 5.15566 12.3V9.9H2.75566C2.09292 9.9 1.55566 9.36274 1.55566 8.7V2.7ZM6.35566 9.9V12.3H12.3557V6.3H9.95566V8.7C9.95566 9.36274 9.41841 9.9 8.75566 9.9H6.35566ZM8.75566 8.7V2.7L2.75566 2.7V8.7H8.75566Z" fill="currentColor" /></svg>';
        }
      }
    });
  }, [copiedStates.value]);

  return null; // This island doesn't render anything directly
}
