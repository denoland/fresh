import denoJson from "../../deno.json" with { type: "json" };

export { extractYaml as frontMatter } from "@std/front-matter";

import * as Marked from "marked";
import { HttpError } from "fresh";
import { asset } from "fresh/runtime";
import { escape as escapeHtml } from "@std/html";
import { mangle } from "marked-mangle";
import GitHubSlugger from "github-slugger";
import { Prism } from "./prism.ts";

const slugger = new GitHubSlugger();

Marked.marked.use(mangle());

const ADMISSION_REG = /^\[(info|warn|tip)\]:\s/;

const LOGOS = [
  {
    lang: /^tsx?$/,
    file: /\.tsx?$/,
    src: asset("/logos/typescript.svg"),
    text: "Typescript",
  },
  {
    lang: /^css$/,
    file: /\.css$/,
    src: asset("/logos/css.svg"),
    text: "CSS",
  },
  {
    lang: /^html$/,
    file: /\.html$/,
    src: asset("/logos/html.svg"),
    text: "HTML",
  },
  {
    lang: /^jsonc?$/,
    file: /\.jsonc?$/,
    src: asset("/logos/json.svg"),
    text: "JSON",
  },
  {
    lang: /^(sh|bash)$/,
    file: /\.sh$/,
    src: asset("/logos/shell.svg"),
    text: "Terminal (Shell/Bash)",
  },
  {
    lang: /^md$/,
    file: /\.md$/,
    src: asset("/logos/markdown.svg"),
    text: "Markdown",
  },
  {
    lang: /^txt(-files)?$/,
    file: /\.txt$/,
    src: asset("/logos/text.svg"),
    text: "Text",
  },
  {
    lang: /^diff$/,
    file: /\.diff$/,
    src: asset("/logos/diff.svg"),
    text: "File diff",
  },
  {
    lang: /^gitignore$/,
    file: /^\.gitignore$/,
    src: asset("/logos/git.svg"),
    text: "Git",
  },
  {
    lang: /^dockerfile$/,
    file: /^Dockerfile$/,
    src: asset("/logos/docker.svg"),
    text: "Docker",
  },
];

export interface MarkdownHeading {
  id: string;
  html: string;
  level: number;
}

class DefaultRenderer extends Marked.Renderer {
  headings: MarkdownHeading[] = [];

  override text(
    token: Marked.Tokens.Text | Marked.Tokens.Escape | Marked.Tokens.Tag,
  ): string {
    if (
      token.type === "text" && "tokens" in token && token.tokens !== undefined
    ) {
      return this.parser.parseInline(token.tokens);
    }

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

  override heading({ tokens, depth }: Marked.Tokens.Heading): string {
    this.#assert(tokens.length > 0, "Markdown heading tokens unexpected value");

    const content = tokens[0];
    this.#assert(
      content.type === "text" || content.type === "codespan",
      "Markdown heading tokens unexpected value",
    );

    let slugInput = content.text;

    // Rewrites e.g. `.get()` to `get`
    if (/^\..*\(\)$/.test(slugInput)) {
      slugInput = slugInput.slice(1, -2);
    }

    const slug = slugger.slug(slugInput);
    const text = this.parser.parseInline(tokens);
    this.headings.push({ id: slug, html: text, level: depth });
    return `<h${depth} id="${slug}"><a class="md-anchor" tabindex="-1" href="#${slug}">${text}<span aria-hidden="true">#</span></a></h${depth}>`;
  }

  override link({ href, title, tokens }: Marked.Tokens.Link) {
    const text = this.parser.parseInline(tokens);
    const titleAttr = title ? ` title="${title}"` : "";
    if (href.startsWith("#")) {
      return `<a href="${href}"${titleAttr}>${text}</a>`;
    }

    return `<a href="${href}"${titleAttr} rel="noopener noreferrer">${text}</a>`;
  }

  override image({ href, text, title }: Marked.Tokens.Image) {
    return `<img src="${href}" alt="${text ?? ""}" title="${title ?? ""}" />`;
  }

  override code({ lang: info, text }: Marked.Tokens.Code): string {
    // For canary only
    text = text.replaceAll(
      /(@fresh\/init)/g,
      `@fresh/init@${denoJson.version}`,
    );

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

    // Find icon by filename first, then by markdown block language.
    const icon = LOGOS.find((l) => l.file.test(title)) ??
      LOGOS.find((l) => l.lang.test(lang));

    let out = `<div class="fenced-code">`;

    if (title || icon) {
      const image = icon
        ? `<img src="${icon.src}" alt="${icon.text}" title="${icon.text}">`
        : "";

      out += `<div class="fenced-code-header">
        <span class="fenced-code-title lang-${lang}">
          ${image}
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

  override blockquote({ text, tokens }: Marked.Tokens.Blockquote): string {
    const match = text.match(ADMISSION_REG);

    if (match) {
      const label: Record<string, string> = {
        tip: "Tip",
        warn: "Warning",
        info: "Info",
      };
      Marked.walkTokens(tokens, (token) => {
        if (token.type === "text" && token.text.startsWith(match[0])) {
          token.text = token.text.slice(match[0].length);
        }
      });
      const type = match[1];
      const icon = `<svg class="icon"><use href="/icons.svg#${type}" /></svg>`;
      return `<blockquote class="admonition ${type}">\n<span class="admonition-header">${icon}${
        label[type]
      }</span>${this.parser.parse(tokens)}</blockquote>\n`;
    }
    return `<blockquote>\n${this.parser.parse(tokens)}</blockquote>\n`;
  }

  #assert(expr: unknown, msg: string): asserts expr {
    if (!expr) throw new Error(msg);
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
  const markedOpts: Marked.MarkedOptions & { async: false } = {
    gfm: true,
    async: false,
    renderer,
  };

  try {
    const html = opts.inline
      ? Marked.parseInline(input, markedOpts)
      : Marked.parse(input, markedOpts);

    return { headings: renderer.headings, html };
  } catch (err) {
    throw new HttpError(500, "Markdown parsing error", {
      cause: err,
    });
  }
}
