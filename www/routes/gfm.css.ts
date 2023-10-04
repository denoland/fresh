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

.markdown-body h1,
.markdown-body h2,
.markdown-body h3,
.markdown-body h4,
.markdown-body h5,
.markdown-body h6,
.markdown-body ul,
.markdown-body ol,
.markdown-body p,
.markdown-body details,
.markdown-body blockquote {
  margin-left: 1rem;
  margin-right: 1rem;
}

.markdown-body blockquote p {
  margin-left: 0
}

@media screen and (min-width: 768px) {
  .markdown-body .fenced-code,
  .markdown-body table {
    margin-left: 1rem;
    margin-right: 1rem;
  }

  .markdown-body details .fenced-code {
    margin-left: 0;
    margin-right: 0;
  }
}

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

.markdown-body .md-anchor {
  color: inherit;
  text-decoration: none !important;
}
.markdown-body .md-anchor span {
  color: var(--color-accent-fg);
  display: inline-block;
  margin-left: .25rem;
  opacity: 0;
  visibility: hidden;
}
.markdown-body .md-anchor:hover span {
  opacity: 1;
  visibility: visible;
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
.fenced-code-header + pre {
  border-top-left-radius: 0 !important;
  border-top-right-radius: 0 !important;
}
.fenced-code-title {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
    "Liberation Mono", "Courier New", monospace;
  font-size: .8125rem;
  line-height: 1;
}

.highlight-source-yml .atrule {
  color: var(--color-prettylights-syntax-entity);
}
.highlight-source-yml .string {
  color: var(--color-prettylights-syntax-string);
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
