import { useSignal } from "@preact/signals";

import Prism from "https://esm.sh/prismjs@1.29.0";
import "https://esm.sh/prismjs@1.29.0/components/prism-typescript?no-check";

interface CodeBoxProps {
  code: string;
}

export default function CodeBox(props: CodeBoxProps) {
  const highlighted = Prism.highlight(
    props.code,
    Prism.languages.typescript,
    "typescript",
  );
  const onCopy = () => {
    navigator.clipboard.writeText(props.code);
    copied.value = true;
  };

  const copied = useSignal(false);
  return (
    <div class="">
      <details>
        <summary class="text-center cursor-pointer bg-gray-50 select-none text-gray-600 hover:text-gray-800 hover:bg-gray-100 py-2 rounded-b">
          Code
        </summary>
        <div class="relative">
          <pre class="bg-gray-800 text-blue-300 p-2 text-sm rounded whitespace-pre-wrap">
            <code
              dangerouslySetInnerHTML={{ __html: highlighted }}
            />
          </pre>
          <button
            onClick={onCopy}
            class="absolute top-2 right-2 px-3 py-2 border border-gray-400 rounded text-white bg-gray-800"
          >
            {copied.value ? "Copied!" : "Copy"}
          </button>
        </div>
      </details>
    </div>
  );
}
