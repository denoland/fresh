import type { ComponentChildren } from "preact";

export function FinishSetup() {
  return (
    <Doc>
      <div class="frsh-error-page">
        <div style="max-width: 48rem; padding: 2rem 1rem; margin: 0 auto; font-family: sans-serif">
          <h1>Finish setting up Fresh</h1>
          <ol style="line-height: 1.6; margin-bottom: 1.5rem">
            <li>
              Go to your project in Deno Deploy and click the{" "}
              <code>Settings</code> tab.
            </li>
            <li>
              In the Git Integration section, enter <code>deno task build</code>
              {" "}
              in the <code>Build Command</code> input.
            </li>
            <li>
              Save the changes.
            </li>
          </ol>
        </div>
      </div>
    </Doc>
  );
}

export function ForgotBuild() {
  return (
    <Doc>
      <div class="frsh-error-page">
        <div style="max-width: 48rem; padding: 2rem 1rem; margin: 0 auto; font-family: sans-serif">
          <h1>Missing build directory</h1>
          <p>
            Did you forget to run <code>deno task build</code>?
          </p>
        </div>
      </div>
    </Doc>
  );
}

function Doc(props: { children?: ComponentChildren }) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Finish setting up Fresh</title>
      </head>
      <body>{props.children}</body>
    </html>
  );
}
