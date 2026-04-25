import { Prism } from "../utils/prism.ts";

export function CodeBlock(
  { code, lang }: { code: string; lang: "js" | "ts" | "jsx" | "md" | "bash" },
) {
  return (
    <pre
      class="rounded-lg text-sm leading-relaxed bg-slate-800 text-white p-3 sm:p-4 overflow-x-auto"
      data-language={lang}
      // deno-lint-ignore react-no-danger
    ><code dangerouslySetInnerHTML={{ __html: Prism.highlight(code, Prism.languages[lang], lang)}} /></pre>
  );
}
