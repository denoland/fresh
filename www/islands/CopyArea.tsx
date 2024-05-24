import { useEffect } from "preact/hooks";
import { IS_BROWSER } from "@fresh/core/runtime";
import * as Icons from "../components/Icons.tsx";
import { useSignal } from "@preact/signals";

export default function CopyArea(props: { code: string }) {
  const copied = useSignal(false);

  async function handleClick() {
    if (props.code === undefined || props.code === null) {
      return;
    }
    try {
      await navigator.clipboard.writeText(props.code.toString());
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
    }, 1000);
    return () => clearTimeout(timer);
  }, [copied.value]);

  return (
    <div class="bg-slate-800 rounded text-green-100 flex items-center min-w-0 overflow-x-auto">
      <pre class="overflow-x-auto w-full flex-1 px-6 py-4">
        {props.code}
      </pre>

      <div class="relative my-2 mr-4 sm:mr-6">
        <div
          class={`hidden transition ease-in-out absolute pointer-events-none bg-gray-900 text-white p-2 -top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-full box-border rounded opacity-0 ${
            copied.value && "block opacity-100"
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
