import { ComponentChildren, h } from "preact";
import { DEBUG } from "./constants.ts";
import type { ErrorPageProps, RouteConfig } from "./types.ts";
import { colors } from "$fresh/src/server/deps.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

// Just to get some syntax highlighting
const css = (arr: TemplateStringsArray, ...exts: never[]) => {
  if (exts.length) throw new Error("Not allowed");
  return arr[0];
};

const errorCss = css`
  :root {
			--bg: #fff;
			--bg-code-frame: rgb(255, 0, 32, 0.1);
			--bg-active-line: #fbcecc;
			--text: #222;
			--text2: #444;
			--title: #e84644;
			--code: #333;
			font-family: sans-serif;
			line-height: 1.4;
			color: var(--text);
			background: var(--bg);
		}

		* {
			box-sizing: border-box;
		}

		@media (prefers-color-scheme: dark) {
			:root {
				--bg-code-frame: rgba(251, 93, 113, 0.2);
				--bg-active-line: #4f1919;
				--bg: #353535;
				--text: #f7f7f7;
				--text2: #ddd;
				--code: #fdd1d1;
			}
		}

		.inner {
			max-width: 48rem;
			padding: 4rem 1rem;
			margin: 0 auto;
		}

		.title {
			color: var(--title);
			font-weight: normal;
			font-size: 1.5rem;
		}

		.code-frame {
			overflow: auto;
			padding: 0.5rem;
      margin-bottom: 0.5rem;
			background: var(--bg-code-frame);
			color: var(--code);
		}
		.line {
			padding: 0.25rem 0.5rem;
		}
		.active-line {
			display: inline-block;
			width: 100%;
			background: var(--bg-active-line);
		}

    .stack {
      overflow-x: auto;
    }
`;

export default function DefaultErrorPage(
  props: ErrorPageProps,
) {
  const { error } = props;

  let title = "An error occurred during route handling or page rendering.";

  let codeFrame;
  let stack;

  if (DEBUG) {
    if (error instanceof Error) {
      title = error.message;
      codeFrame = props.codeFrame;
      stack = error.stack ?? "";
    } else {
      title = String(error);
    }
  }

  return (
    <div class="frsh-error-page">
      <style id="fresh_error_styles">{errorCss}</style>
      <div class="inner">
        <h1 class="title">{title}</h1>
        {codeFrame ? <CodeFrame codeFrame={codeFrame} /> : null}
        {stack ? <pre class="stack">{stack}</pre> : null}
      </div>
    </div>
  );
}

function CodeFrame(props: { codeFrame: string }) {
  const lines: ComponentChildren[] = [];

  colors.stripColor(props.codeFrame.trimEnd()).split("\n").forEach(
    (line, i, arr) => {
      const vnode = (
        <span
          class={"line" + (line.startsWith(">") ? " active-line" : "")}
        >
          {line}
        </span>
      );

      lines.push(vnode);
      if (i < arr.length - 1) lines.push("\n");
    },
  );
  return (
    <pre class="code-frame">
      <code>{lines}</code>
    </pre>
  );
}
