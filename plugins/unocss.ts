import {
  UnoGenerator,
  type UserConfig,
} from "https://esm.sh/@unocss/core@0.55.1";
import type { Theme } from "https://esm.sh/@unocss/preset-uno@0.55.1";
import { Plugin } from "$fresh/server.ts";
import { exists } from "$fresh/src/server/deps.ts";

// inline reset from https://esm.sh/@unocss/reset@0.54.2/tailwind.css
const unoResetCSS = `/* reset */
*,:before,:after{box-sizing:border-box;border:0 solid}html{-webkit-text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica Neue,Arial,Noto Sans,sans-serif,Apple Color Emoji,Segoe UI Emoji,Segoe UI Symbol,Noto Color Emoji;line-height:1.5}body{line-height:inherit;margin:0}hr{height:0;color:inherit;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{color:inherit;text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,samp,pre{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,Courier New,monospace;font-size:1em}small{font-size:80%}sub,sup{vertical-align:baseline;font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}button,[type=button],[type=reset],[type=submit]{-webkit-appearance:button;background-color:#0000;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}progress{vertical-align:baseline}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}blockquote,dl,dd,h1,h2,h3,h4,h5,h6,hr,figure,p,pre{margin:0}fieldset{margin:0;padding:0}legend{padding:0}ol,ul,menu{margin:0;padding:0;list-style:none}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}button,[role=button]{cursor:pointer}:disabled{cursor:default}img,svg,video,canvas,audio,iframe,embed,object{vertical-align:middle;display:block}img,video{max-width:100%;height:auto}
`;

type UnoCssPluginOptions = {
  runtime?: boolean;
  config?: UserConfig;
};

/**
 * Helper function for typing of config objects
 */
export function defineConfig<T extends object = Theme>(config: UserConfig<T>) {
  return config;
}

/**
 * UnoCSS plugin - automatically generates CSS utility classes
 *
 * @param [opts] Plugin options
 * @param [opts.runtime] By default the UnoCSS runtime will run in the browser. Set to `false` to disable this.
 * @param [opts.config] Explicit UnoCSS config object. By default `uno.config.ts` file. Not supported with the browser runtime.
 */
export default async function unocss(
  opts: UnoCssPluginOptions = {},
): Promise<Plugin> {
  // Include the browser runtime by default
  const runtime = opts.runtime ?? true;

  // If a config object is not provided, a uno.config.ts file is required in the project directory
  const configURL = new URL("./uno.config.ts", Deno.mainModule);
  if (
    opts.config === undefined &&
    !await exists(configURL, { isFile: true, isReadable: true })
  ) {
    throw new Error(
      "uno.config.ts not found in the project directory! Please create it or pass a config object to the UnoCSS plugin",
    );
  }

  const config: UserConfig = opts.config ??
    (await import(configURL.toString())).default;

  const uno = new UnoGenerator(config);

  return {
    name: "unocss",
    entrypoints: runtime
      ? {
        "main": `
        data:application/javascript,
        import config from "${configURL}";
        import init from "https://esm.sh/@unocss/runtime@0.55.1";
        export default function() {
          window.__unocss = config;
          init();
        }`,
      }
      : {},
    async renderAsync(ctx) {
      const { htmlText } = await ctx.renderAsync();
      const { css } = await uno.generate(htmlText);
      return {
        scripts: runtime ? [{ entrypoint: "main", state: {} }] : [],
        styles: [{ cssText: `${unoResetCSS}\n${css}` }],
      };
    },
  };
}
