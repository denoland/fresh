import type { ComponentChildren } from "preact";

// Just to get some syntax highlighting
const css = (arr: TemplateStringsArray, ...exts: never[]) => {
  if (exts.length) throw new Error("Not allowed");
  return arr[0];
};

export const errorCss = css`
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
    padding: 0;
    margin: 0;
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
    margin-bottom: 1rem;
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

  .close-btn {
    position: absolute;
    top: 1rem;
    right: 1rem;
    color: var(--title);
    display: block;
    width: 3rem;
    height: 3rem;
    background: none;
    border: none;
    transform: translate3d(0, 0, 0);
  }
  .close-btn:active {
    transform: translate3d(0, 2px, 0);
  }
  .close-btn:hover {
    cursor: pointer;
    filter: drop-shadow(0 0 0.75rem crimson);
  }
`;

function CodeFrame(props: { codeFrame: string }) {
  const lines: ComponentChildren[] = [];

  props.codeFrame.trimEnd().split("\n").forEach(
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

const DEFAULT_MESSAGE = "Internal Server Error";

export function ErrorOverlay(props: { url: URL }) {
  const url = props.url;
  const title = url.searchParams.get("message") || DEFAULT_MESSAGE;
  const stack = url.searchParams.get("stack");
  const codeFrame = url.searchParams.get("code-frame");

  if (title === DEFAULT_MESSAGE && !stack && !codeFrame) {
    return null;
  }

  return (
    <>
      <div class="frsh-error-page">
        <style dangerouslySetInnerHTML={{ __html: errorCss }} />
        <div class="inner">
          <div class="header">
            <button
              type="button"
              class="close-btn"
              aria-label="close"
              id="close-btn"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </button>
          </div>
          <div>
            <h1 class="title">{title}</h1>
            {codeFrame ? <CodeFrame codeFrame={codeFrame} /> : null}
            {stack ? <pre class="stack">{stack}</pre> : null}
          </div>
        </div>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html:
            `document.querySelector("#close-btn").addEventListener("click", () => parent.postMessage("close-error-overlay"));`,
        }}
      />
    </>
  );
}
