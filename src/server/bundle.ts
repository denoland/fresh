import { denoPlugin, esbuild } from "./deps.ts";
import { Page } from "./routes.ts";

let esbuildInitalized: boolean | Promise<void> = false;
async function ensureEsbuildInialized() {
  if (esbuildInitalized === false) {
    esbuildInitalized = await esbuild.initialize({
      wasmURL: "https://unpkg.com/esbuild-wasm@0.11.19/esbuild.wasm",
      worker: false,
    });
    await esbuildInitalized;
    esbuildInitalized = true;
  } else if (esbuildInitalized instanceof Promise) {
    await esbuildInitalized;
  }
}

export async function bundle(page: Page): Promise<string> {
  const runtime = new URL("../../runtime.ts", import.meta.url);
  const contents = `
import Page from "${page.url}";
import { h, render } from "${runtime.href}";

addEventListener("DOMContentLoaded", () => {
  const props = JSON.parse(document.getElementById("__FRSH_PROPS").textContent);
  render(h(Page, props), document.body);  
});
`;
  await ensureEsbuildInialized();
  const bundle = await esbuild.build({
    plugins: [denoPlugin({ loader: "portable" })],
    write: false,
    bundle: true,
    minify: true,
    platform: "neutral",
    outfile: "",
    jsxFactory: "h",
    jsxFragment: "Fragment",
    stdin: {
      contents,
      sourcefile: `fresh://entrypoint/${page.name}`,
    },
  });
  return bundle.outputFiles[0].text;
}
