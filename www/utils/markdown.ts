export * as gfm from "https://deno.land/x/gfm@0.2.5/mod.ts";
import "https://esm.sh/prismjs@1.29.0/components/prism-jsx.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-typescript.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-tsx.js?no-check";
import "https://esm.sh/prismjs@1.29.0/components/prism-diff.js?no-check";
import Prism from "https://esm.sh/prismjs@1.29.0";

export { extract as frontMatter } from "$std/front_matter/yaml.ts";

import * as Marked from "https://esm.sh/marked@7.0.2";
import { escape as escapeHtml } from "$std/html/entities.ts";
import * as sucrase from "https://esm.sh/sucrase@3.34.0";
import { mangle } from "$marked-mangle";

Marked.marked.use(mangle());

function replaceExtName(file: string, newExt: string) {
  const idx = file.lastIndexOf(".");
  if (idx > -1) {
    return file.slice(0, idx) + "." + newExt;
  }
  return file;
}

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
    return `<h${level} id="${slug}"><a class="anchor" aria-hidden="true" tabindex="-1" href="#${slug}">#</a>${text}</h${level}>`;
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
    // format: tsx { "foo": 1 }
    let meta: Record<string, unknown> = {};
    let lang = "";
    const match = info?.match(/^(\w+)(\s+(.*))?$/);
    if (match) {
      lang = match[1].toLocaleLowerCase();
      if (match[3]) {
        try {
          meta = JSON.parse(match[3]) as Record<string, unknown>;
        } catch (err) {
          console.log(JSON.stringify(match[3]));
          console.log(err);
        }
      }
    }

    const title = String(meta.title ?? "");
    const snippets: {
      lang: string;
      code: string;
      title: string;
    }[] = [{
      title,
      lang,
      code,
    }];

    if (!("lang_switcher" in meta) && (lang === "ts" || lang === "tsx")) {
      meta.lang_switcher = true;
    }
    if (!("transform" in meta)) {
      meta.transform = true;
    }

    let switcher = "";
    if (meta.lang_switcher && (lang === "ts" || lang === "tsx")) {
      switcher = `<select class="fenced-code-dropdown">
        <option value="ts">TypeScript</option>
        <option value="js">JavaScript</option>
      </select>
      `;

      try {
        let transformedCode = code;
        if (meta.transform) {
          const result = sucrase.transform(code, {
            disableESTransforms: true,
            keepUnusedImports: true,
            preserveDynamicImport: true,
            production: false,
            transforms: ["typescript", "jsx"],
            jsxRuntime: "preserve",
          });

          transformedCode = result.code
            // Remove empty imports after TS conversion
            .replace(/^import\s+{\s*}\s+from\s+["'].*["'];$/gm, "")
            // Sucrase leaves some spacee after "as" modifier
            .replace(/\s+;$/gm, ";")
            .replace(/\s+,/gm, ",")
            // Update import specifiers
            .replace(/\.tsx";$/gm, '.jsx";')
            .replace(/\.ts";$/gm, '.js";')
            // Trim multiline whitespace
            .replace(/^(\s*\n){2,}/gm, "\n");
        }

        const actualLang = `j${lang.slice(1)}`;
        const actualTitle = replaceExtName(title, actualLang);

        snippets.push({
          title: actualTitle,
          lang: actualLang,
          code: transformedCode,
        });
      } catch (err) {
        console.log(code.slice(Math.max(0, err.pos), err.pos + 100));
        console.log(err);
      }
    }

    const switcherClass = switcher ? " with-switcher" : "";
    let out = `<div class="fenced-code${switcherClass}">
      <div class="fenced-code-header">`;

    for (let i = 0; i < snippets.length; i++) {
      const { title, lang } = snippets[i];
      out += `<span class="fenced-code-title lang-${lang}">${
        title ? escapeHtml(String(title)) : "&nbsp;"
      }</span>`;
    }

    out += `${switcher}</div>`;

    for (let i = 0; i < snippets.length; i++) {
      const { code, lang } = snippets[i];
      const grammar = lang && Object.hasOwnProperty.call(Prism.languages, lang)
        ? Prism.languages[lang]
        : undefined;

      if (grammar === undefined) {
        out += `<pre><code class="notranslate">${
          escapeHtml(code)
        }</code></pre>`;
      } else {
        const html = Prism.highlight(code, grammar, lang);
        out +=
          `<pre class="highlight highlight-source-${lang} notranslate lang-${lang}">${html}</pre>`;
      }
    }

    out += `</div>`;
    return out;
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
