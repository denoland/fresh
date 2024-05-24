import Prism from "https://esm.sh/prismjs@1.29.0";

export function CodeBlock(
  { code, lang }: { code: string; lang: "js" | "ts" | "jsx" | "md" | "bash" },
) {
  return (
    <pre
      class="rounded-lg text-base leading-relaxed bg-slate-800 text-white p-4 sm:p-6 md:p-4 lg:p-6 2xl:p-8 overflow-x-auto"
      data-language={lang}
    ><code dangerouslySetInnerHTML={{ __html: Prism.highlight(code, Prism.languages[lang], lang)}} /></pre>
  );
}
