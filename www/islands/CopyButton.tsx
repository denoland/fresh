/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import * as Icons from "../components/Icons.tsx";

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <div class={tw`relative`}>
      <div
        class={tw`transition ease-in-out absolute pointer-events-none bg-gray-900 text-white absolute p-2 -top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-full box-border rounded opacity-0 ${
          copied && "opacity-100"
        }`}
      >
        Copied!
      </div>
      <button
        aria-label="Copy to Clipboard"
        disabled={!IS_BROWSER}
        class={tw`rounded p-1.5 border border-[#D2D2DC] hover:bg-gray-200 text-green-600 relative`}
        onClick={() => {
          navigator.clipboard.writeText(text);
          setCopied(true);

          setTimeout(() => {
            setCopied(false);
          }, 2000);
        }}
      >
        {copied ? <Icons.Check /> : <Icons.Copy />}
      </button>
    </div>
  );
}
