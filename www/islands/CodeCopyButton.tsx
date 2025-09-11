import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "fresh/runtime";
import { useSignal } from "@preact/signals";
import * as Icons from "../components/Icons.tsx";
import { render } from "preact";

interface CopyButtonProps {
  language: string;
  copied: boolean;
  onCopy: () => void;
}

function CopyButton(
  { language, copied, onCopy }: CopyButtonProps,
) {
  return (
    <div class="copy-button-container absolute top-3 right-3">
      <div
        class={`absolute pointer-events-none bg-foreground-primary text-background-primary text-sm px-2 py-1 rounded -top-8 left-1/2 transform -translate-x-1/2 transition-opacity duration-200 z-10 ${
          copied ? "opacity-100" : "opacity-0"
        }`}
      >
        Copied!
      </div>
      <button
        type="button"
        aria-label={`Copy ${language || "code"} to clipboard`}
        disabled={!IS_BROWSER}
        class={`rounded p-1.5 border transition-colors backdrop-blur-sm ${
          copied
            ? "text-fresh-green border-fresh-green/40 bg-fresh-green/10"
            : "border-foreground-secondary/30 hover:bg-foreground-secondary/20 text-foreground-secondary"
        }`}
        onClick={onCopy}
      >
        {copied ? <Icons.Check /> : <Icons.Copy />}
      </button>
    </div>
  );
}

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

      // Create a container for the copy button and render it with Preact
      const container = document.createElement("div");
      block.appendChild(container);

      const renderButton = () => {
        const copied = copiedStates.value[blockId] || false;
        render(
          <CopyButton
            language={language}
            copied={copied}
            onCopy={() => handleCopy(codeText, blockId)}
          />,
          container,
        );
      };

      renderButton();

      // Store the render function to call it when state changes
      // Store render function for later re-rendering
      // deno-lint-ignore no-explicit-any
      (container as any)._renderButton = renderButton;
    });
  }, []);

  useEffect(() => {
    if (!IS_BROWSER) return;

    // Re-render all buttons when copied states change
    document.querySelectorAll(".copy-button-container")
      .forEach((container) => {
        // deno-lint-ignore no-explicit-any
        const renderButton = (container.parentElement as any)?._renderButton;
        if (renderButton) renderButton();
      });
  }, [copiedStates.value]);

  return null; // This island doesn't render anything directly
}
