import { useState } from "preact/hooks";

interface CodeBoxProps {
  code: string;
}

export default function CodeBox(props: CodeBoxProps) {
  const onCopy = () => {
    navigator.clipboard.writeText(props.code);
    setCopied(true);
  };

  const [copied, setCopied] = useState(false);
  return (
    <div class="">
      <details>
        <summary class="text-center cursor-pointer bg-gray-50 select-none text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded-b">
          Code
        </summary>
        <code class="relative">
          <pre class="bg-gray-800 text-blue-300 p-2 text-sm rounded whitespace-pre-wrap">{props.code}</pre>
          <button
            onClick={onCopy}
            class="absolute top-2 right-2 px-3 py-2 border border-gray-400 rounded text-white"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </code>
      </details>
    </div>
  );
}
