import Prism from "prismjs";
import "prismjs/components/prism-jsx.js";
import "prismjs/components/prism-typescript.js";
import "prismjs/components/prism-tsx.js";
import "prismjs/components/prism-diff.js";
import "prismjs/components/prism-json.js";
import "prismjs/components/prism-bash.js";
import "prismjs/components/prism-yaml.js";

export { extractYaml as frontMatter } from "@std/front-matter";

import * as Marked from "marked";
import { escape as escapeHtml } from "@std/html";
import { mangle } from "marked-mangle";
import GitHubSlugger from "github-slugger";

const slugger = new GitHubSlugger();

Marked.marked.use(mangle());

const ADMISSION_REG = /^<p>\[(info|warn|tip)\]:\s/;

export interface MarkdownHeading {
  id: string;
  html: string;
}

class DefaultRenderer extends Marked.Renderer {
  headings: MarkdownHeading[] = [];

  text(
    token: Marked.Tokens.Text | Marked.Tokens.Escape | Marked.Tokens.Tag,
  ): string {
    // Smartypants typography enhancement
    return token.text
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

  heading({
    text,
    depth,
    raw,
  }: Marked.Tokens.Heading): string {
    const slug = slugger.slug(raw);
    this.headings.push({ id: slug, html: text });
    return `<h${depth} id="${slug}"><a class="md-anchor" tabindex="-1" href="#${slug}">${text}<span aria-hidden="true">#</span></a></h${depth}>`;
  }

  link({ href, title, text }: Marked.Tokens.Link) {
    const titleAttr = title ? ` title="${title}"` : "";
    if (href.startsWith("#")) {
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }

    return `<a href="${href}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
  }

  image({ href, text, title }: Marked.Tokens.Image) {
    return `<img src="${href}" alt="${text ?? ""}" title="${title ?? ""}" />`;
  }

  code({ lang: info, text }: Marked.Tokens.Code): string {
    // format: tsx
    // format: tsx my/file.ts
    // format: tsx "This is my title"
    let lang = "";
    let title = "";
    const match = info?.match(/^([\w_-]+)\s*(.*)?$/);
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
      out += `<pre><code class="notranslate">${escapeHtml(text)}</code></pre>`;
    } else {
      const html = Prism.highlight(text, grammar, lang);
      out +=
        `<pre class="highlight highlight-source-${lang} notranslate lang-${lang}"><code>${html}</code></pre>`;
    }

    out += `</div>`;
    return out;
  }

  blockquote({ text }: Marked.Tokens.Blockquote): string {
    const match = text.match(ADMISSION_REG);
    if (match) {
      const label: Record<string, string> = {
        tip: "Tip",
        warn: "Warning",
        info: "Info",
      };
      const type = match[1];
      text = text.slice(match[0].length);
      const icon = `<svg class="icon"><use href="/icons.svg#${type}" /></svg>`;
      return `<blockquote class="admonition ${type}">\n<span class="admonition-header">${icon}${
        label[type]
      }</span>${text}</blockquote>\n`;
    }
    return `<blockquote>\n${text}</blockquote>\n`;
  }
}

export interface MarkdownOptions {
  inline?: boolean;
}
export function renderMarkdown(
  input: string,
  opts: MarkdownOptions = {},
): { headings: MarkdownHeading[]; html: string } {
  const renderer = new DefaultRenderer();
  const markedOpts: Marked.MarkedOptions = {
    gfm: true,
    renderer,
  };

  const html = opts.inline
    ? Marked.parseInline(input, markedOpts) as string
    : Marked.parse(input, markedOpts) as string;

  return { headings: renderer.headings, html };
}
