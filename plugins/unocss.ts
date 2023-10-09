import { JSX, options as preactOptions, VNode } from "preact";

import {
  UnoGenerator,
  type UserConfig,
} from "https://esm.sh/@unocss/core@0.55.1";
import type { Theme } from "https://esm.sh/@unocss/preset-uno@0.55.1";

import { Plugin } from "$fresh/server.ts";
import { exists } from "$fresh/src/server/deps.ts";

type PreactOptions = typeof preactOptions & { __b?: (vnode: VNode) => void };

// inline reset from https://esm.sh/@unocss/reset@0.56.5/tailwind-compat.css
const unoResetCSS = `/* reset */
a,hr{color:inherit}progress,sub,sup{vertical-align:baseline}blockquote,body,dd,dl,fieldset,figure,h1,h2,h3,h4,h5,h6,hr,menu,ol,p,pre,ul{margin:0}fieldset,legend,menu,ol,ul{padding:0}*,::after,::before{box-sizing:border-box;border-width:0;border-style:solid;border-color:var(--un-default-border-color,#e5e7eb)}html{line-height:1.5;-webkit-text-size-adjust:100%;text-size-adjust:100%;-moz-tab-size:4;tab-size:4;font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"}body{line-height:inherit}hr{height:0;border-top-width:1px}abbr:where([title]){text-decoration:underline dotted}h1,h2,h3,h4,h5,h6{font-size:inherit;font-weight:inherit}a{text-decoration:inherit}b,strong{font-weight:bolder}code,kbd,pre,samp{font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,"Liberation Mono","Courier New",monospace;font-size:1em}small{font-size:80%}sub,sup{font-size:75%;line-height:0;position:relative}sub{bottom:-.25em}sup{top:-.5em}table{text-indent:0;border-color:inherit;border-collapse:collapse}button,input,optgroup,select,textarea{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button,select{text-transform:none}[type=button],[type=reset],[type=submit],button{-webkit-appearance:button;background-image:none}:-moz-focusring{outline:auto}:-moz-ui-invalid{box-shadow:none}::-webkit-inner-spin-button,::-webkit-outer-spin-button{height:auto}[type=search]{-webkit-appearance:textfield;outline-offset:-2px}::-webkit-search-decoration{-webkit-appearance:none}::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}summary{display:list-item}menu,ol,ul{list-style:none}textarea{resize:vertical}input::placeholder,textarea::placeholder{opacity:1;color:#9ca3af}[role=button],button{cursor:pointer}:disabled{cursor:default}audio,canvas,embed,iframe,img,object,svg,video{display:block;vertical-align:middle}img,video{max-width:100%;height:auto}[hidden]{display:none}
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
 * Installs a hook in Preact to extract classes during server-side renders
 * @param classes - Set of class strings, which will be mutated by this function.
 */
export function installPreactHook(classes: Set<string>) {
  // Hook into options._b which is called whenever a new comparison
  // starts in Preact.
  const originalHook = (preactOptions as PreactOptions).__b;
  (preactOptions as PreactOptions).__b = (
    // deno-lint-ignore no-explicit-any
    vnode: VNode<JSX.DOMAttributes<any>>,
  ) => {
    if (typeof vnode.type === "string" && typeof vnode.props === "object") {
      const { props } = vnode;
      if (props.class) {
        props.class.split(" ").forEach((cls) => classes.add(cls));
      }
      if (props.className) {
        props.className.split(" ").forEach((cls) => classes.add(cls));
      }
    }

    originalHook?.(vnode);
  };
}

/**
 * UnoCSS plugin - automatically generates CSS utility classes
 *
 * @param [opts] Plugin options
 * @param [opts.runtime] By default the UnoCSS runtime will run in the browser. Set to `false` to disable this.
 * @param [opts.config] Explicit UnoCSS config object. By default `uno.config.ts` file. Not supported with the browser runtime.
 */
export default function unocss(
  opts: UnoCssPluginOptions = {},
): Plugin {
  // Include the browser runtime by default
  const runtime = opts.runtime ?? true;

  // A uno.config.ts file is required in the project directory if a config object is not provided,
  // or to use the browser runtime
  const configURL = new URL("./uno.config.ts", Deno.mainModule);

  // Create a set that will be used to hold class names encountered during SSR
  const classes = new Set<string>();

  // Hook into Preact to add to the set of classes on each server-side render
  installPreactHook(classes);

  let uno: UnoGenerator;
  if (opts.config !== undefined) {
    uno = new UnoGenerator(opts.config);
  } else {
    import(configURL.toString()).then((mod) => {
      uno = new UnoGenerator(mod.default);
    }).catch((error) => {
      exists(configURL, { isFile: true, isReadable: true }).then(
        (configFileExists) => {
          throw configFileExists ? error : new Error(
            "uno.config.ts not found in the project directory! Please create it or pass a config object to the UnoCSS plugin",
          );
        },
      );
    });
  }

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
      classes.clear();
      await ctx.renderAsync();
      const { css } = await uno.generate(classes);

      return {
        scripts: runtime ? [{ entrypoint: "main", state: {} }] : [],
        styles: [{ cssText: `${unoResetCSS}\n${css}` }],
      };
    },
  };
}
