import { Handlers } from "$fresh/server.ts";
import { gfm } from "../utils/markdown.ts";

// TODO(lucacasonato): hash the file and use the hash as the filename, and serve
// with high-cacheability headers.
function css(template: TemplateStringsArray, ...params: string[]) {
  let out = "";

  for (let i = 0; i < template.length; i++) {
    out += template[i];
    if (i < params.length) {
      out += String(params[i]);
    }
  }

  return out;
}

const CSS = css`${gfm.CSS}

ol.nested {
	counter-reset: item;
}

ol.nested li {
	display: block;
}

ol.nested li:before {
	font-feature-settings: "kern" 1, "tnum" 1;
	-webkit-font-feature-settings: "kern" 1, "tnum" 1;
	-ms-font-feature-settings: "kern" 1, "tnum" 1;
	-moz-font-feature-settings: "kern" 1, "tnum" 1;
	content: counters(item, ".") ". ";
	counter-increment: item;
}

.markdown-body ul {
  list-style: disc;
}

.markdown-body ol {
  list-style: numeric;
}

.markdown-body .highlight {
  border: 1px solid #eaeef1;
  border-radius: .5rem;
}

.toggle:checked + .toggled {
	display: block;
}

.fenced-code {
  margin-bottom: 1rem;
}
.fenced-code pre {
  margin-bottom: 0;
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
.fenced-code-header {
  border-top-left-radius: .5rem;
  border-top-right-radius: .5rem;
  padding: 0.5rem;
  background: #eaeef1;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.fenced-code-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: .8125rem;
  line-height: 1;
}
.fenced-code-dropdown {
  background: none;
  font-size: .875rem;
  cursor: pointer;
}
.fenced-code.with-switcher pre {
  display: none;
}
.fenced-code.with-switcher .fenced-code-title {
  display: none;
}
[data-code-lang="ts"] .fenced-code pre.lang-ts,
[data-code-lang="ts"] .fenced-code pre.lang-tsx,
[data-code-lang="ts"] .fenced-code-title.lang-ts,
[data-code-lang="ts"] .fenced-code-title.lang-tsx {
  display: block;
}
[data-code-lang="js"] .fenced-code pre.lang-js,
[data-code-lang="js"] .fenced-code pre.lang-jsx,
[data-code-lang="js"] .fenced-code-title.lang-js,
[data-code-lang="js"] .fenced-code-title.lang-jsx {
  display: block;
}
`;

export const handler: Handlers = {
  GET: () => {
    return new Response(CSS, {
      headers: {
        "content-type": "text/css",
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  },
};
