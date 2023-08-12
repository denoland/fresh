import * as Marked from "https://esm.sh/marked@7.0.2";

class DefaultRenderer extends Marked.Renderer {
  heading(
    text: string,
    level: 1 | 2 | 3 | 4 | 5 | 6,
    raw: string,
    slugger: Marked.Slugger,
  ): string {
    const slug = slugger.slug(raw);
    return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}">#</a>${text}</h${level}>`;
  }
}

export interface MarkdownOptions {
  inline?: boolean;
  disableHtmlSanitization?: boolean;
  renderer?: Marked.Renderer;
}
export function renderMarkdown(input: string, opts: MarkdownOptions = {}) {
  const markedOpts: Marked.MarkedOptions = {
    gfm: true,
    renderer: opts.renderer ?? new DefaultRenderer(),
  };

  const html = opts.inline
    ? Marked.parseInline(input, markedOpts)
    : Marked.parse(input, markedOpts);

  if (opts.disableHtmlSanitization) {
    return html;
  }
}
