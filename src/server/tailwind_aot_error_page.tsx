import { AOT_GH_ACTION } from "../dev/imports.ts";

const LINK = "https://fresh.deno.dev/docs/concepts/ahead-of-time-builds";

export default function TailwindErrorPage() {
  return (
    <div class="frsh-error-page">
      <div style="max-width: 48rem; padding: 2rem 1rem; margin: 0 auto; font-family: sans-serif">
        <h1>Finish setting up Fresh</h1>
        <p style="line-height: 1.6;margin-bottom: 1rem;">
          The <b>tailwindcss</b>{" "}
          plugin requires ahead of time builds to be set up for production
          usage. To finish the setup, follow these steps:
        </p>
        <ol style="line-height: 1.6; margin-bottom: 1.5rem">
          <li>
            Go to your project in Deno Deploy and click the{" "}
            <code>Settings</code> tab.
          </li>
          <li>
            Set Git-Integration to <code>GitHub Action</code>.<br />
            <i style="display: block; font-style: italic; color: gray;">
              Unlink the repository first if it is already linked via{"  "}
              <code>Automatic</code> and re-link it again.
            </i>
          </li>
          <li>
            Add the file <code>.github/workflows/deploy.yml</code>{" "}
            to your repository with the following contents:<br />
            <span style="background: #f0f0f0;display: block; position: relative;">
              <button
                id="copy-gh-action"
                style="position: absolute; top: .5rem; right: .5rem;z-index: 100"
              >
                copy code
              </button>
              <pre style="height: 200px; overflow: auto;padding: 1rem;"><code>{AOT_GH_ACTION}</code></pre>
            </span>
          </li>
          <li>
            Copy the project name under <code>Setting {">"} Project Name</code>
            {" "}
            and replace "example project" with your actual project name in{" "}
            <code>.github/workflows/deploy.yml</code>.
          </li>
          <li>
            Commit the file you created and merge it into the <code>main</code>
            {" "}
            branch. This will trigger a new deployment and finish the setup.
          </li>
        </ol>
        <p>
          See the detailed guide here: <a href={LINK}>{LINK}</a>.
        </p>
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            const copyBtn = document.querySelector("#copy-gh-action");
            if (copyBtn) {
              let timeout;
              const text = copyBtn.textContent;
              copyBtn.addEventListener("click", async () => {
                copyBtn.textContent = "copied!";

                clearTimeout(timeout);
                timeout = setTimeout(() => {
                  copyBtn.textContent = text
                }, 2000);

                const code = \`${AOT_GH_ACTION}\`;
                await navigator.clipboard.writeText(code);
              })
            }
            `,
        }}
      />
    </div>
  );
}
