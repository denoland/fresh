import { ComponentChildren } from "preact";
import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import * as Icons from "../components/Icons.tsx";
import { useSignal } from "@preact/signals";

export default function CopyArea(props: { children: ComponentChildren }) {
  const copied = useSignal(false);

  async function handleClick() {
    if (props.children === undefined || props.children === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(props.children.toString());
      copied.value = true;
    } catch (error) {
      copied.value = false;
      console.error((error && error.message) || "Copy failed");
    }
  }

  useEffect(() => {
    if (!copied.value) {
      return;
    }
    const timer = setTimeout(() => {
      copied.value = false;
    }, 2000);
    return () => clearTimeout(timer);
  }, [copied.value]);

  return (
    <div class="bg(gray-800) rounded text-white flex items-center">
      <pre class="overflow-x-auto flex-1 py-2 px-4">
        {props.children}
      </pre>

      <div class="relative my-2 mr-4">
        <div
          class={`transition ease-in-out absolute pointer-events-none bg-gray-900 text-white absolute p-2 -top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-full box-border rounded opacity-0 ${
            copied.value && "opacity-100"
          }`}
        >
          Copied!
        </div>
        <button
          aria-label="Copy to Clipboard"
          disabled={!IS_BROWSER}
          class={`rounded p-1.5 border border-gray-300 hover:bg-gray-700 ${
            copied.value ? "text-green-500" : ""
          } relative`}
          onClick={handleClick}
        >
          {copied.value ? <Icons.Check /> : <Icons.Copy />}
        </button>
      </div>
    </div>
  );
}
