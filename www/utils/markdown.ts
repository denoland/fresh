import "https://esm.sh/prismjs@1.29.0/components/prism-jsx.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-typescript.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-tsx.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-diff.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-json.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-bash.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-yaml.js?no-check";

export { extract as frontMatter } from "$std/front_matter/yaml.ts";

import Prism from "https://esm.sh/prismjs@1.29.0";
import * as Marked from "https://esm.sh/marked@7.0.2";
import { escape as escapeHtml } from "$std/html/entities.ts";
import { mangle } from "$marked-mangle";

Marked.marked.use(mangle());

const ADMISSION_REG = /^<p>\[(info|warn|tip)\]:\s/;

class DefaultRenderer extends Marked.Renderer {
  text(text: string): string {
    // Smartypants typography enhancement
    return text
      .replaceAll("...", "&#8230;")
      .replaceAll("--", "&#8212;")
      .replaceAll("---", "&#8211;")
      .replaceAll(/(\w)'(\w)/g, "$1&#8217;$2")
      .replaceAll(/s'/g, "s&#8217;")
      .replaceAll("&#39;", "&#8217;")
      .replaceAll(/["](.*?)["]/g, "&#8220;$1&#8221")
      .replaceAll(/&quot;(.*?)&quot;/g, "&#8220;$1&#8221")
      .replaceAll(/['](.*?)[']/g, "&#8216;$1&#8217;");
  }

  heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
    slugger: Marked.Slugger,
  ): string {
    const slug = slugger.slug(raw);
    return `<h${level} id="${slug}"><a class="md-anchor" tabindex="-1" href="#${slug}">${text}<span aria-hidden="true">#</span></a></h${level}>`;
  }

  link(href: string, title: string | null, text: string) {
    const titleAttr = title ? ` title="${title}"` : "";
    if (href.startsWith("#")) {
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }
    if (this.options.baseUrl) {
      try {
        href = new URL(href, this.options.baseUrl).href;
      } catch (_) {
        //
      }
    }
    return `<a href="${href}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
  }

  image(src: string, title: string | null, alt: string | null) {
    return `<img src="${src}" alt="${alt ?? ""}" title="${title ?? ""}" />`;
  }

  code(code: string, info: string | undefined): string {
    // format: tsx
    // format: tsx my/file.ts
    // format: tsx "This is my title"
    let lang = "";
    let title = "";
    const match = info?.match(/^(\w+)\s*(.*)?$/);
    if (match) {
      lang = match[1].toLocaleLowerCase();
      title = match[2] ?? "";
    }

    let out = `<div class="fenced-code">`;

    if (title) {
      out += `<div class="fenced-code-header">
        <span class="fenced-code-title lang-${lang}">
          ${title ? escapeHtml(String(title)) : "&nbsp;"}
        </span>
      </div>`;
    }

    const grammar = lang && Object.hasOwnProperty.call(Prism.languages, lang)
      ? Prism.languages[lang]
      : undefined;

    if (grammar === undefined) {
      out += `<pre><code class="notranslate">${escapeHtml(code)}</code></pre>`;
    } else {
      const html = Prism.highlight(code, grammar, lang);
      out +=
        `<pre class="highlight highlight-source-${lang} notranslate lang-${lang}"><code>${html}</code></pre>`;
    }

    out += `</div>`;
    return out;
  }

  blockquote(quote: string): string {
    const match = quote.match(ADMISSION_REG);
    if (match) {
      const label: Record<string, string> = {
        tip: "Tip",
        warn: "Warning",
        info: "Info",
      };
      const type = match[1];
      quote = quote.slice(match[0].length);
      const icon = `<svg class="icon"><use href="/icons.svg#${type}" /></svg>`;
      return `<blockquote class="admonition ${type}">\n<span class="admonition-header">${icon}${
        label[type]
      }</span>${quote}</blockquote>\n`;
    }
    return `<blockquote>\n${quote}</blockquote>\n`;
  }
}

export interface MarkdownOptions {
  inline?: boolean;
}
export function renderMarkdown(
  input: string,
  opts: MarkdownOptions = {},
): string {
  const markedOpts: Marked.MarkedOptions = {
    gfm: true,
    renderer: new DefaultRenderer(),
  };

  const html = opts.inline
    ? Marked.parseInline(input, markedOpts) as string
    : Marked.parse(input, markedOpts) as string;

  return html;
}
