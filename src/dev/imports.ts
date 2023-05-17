export const RECOMMENDED_PREACT_VERSION = "10.13.1";
export const RECOMMENDED_PREACT_RTS_VERSION = "5.2.6";
export const RECOMMENDED_PREACT_SIGNALS_VERSION = "1.1.3";
export const RECOMMENDED_PREACT_SIGNALS_CORE_VERSION = "1.2.3";
export const RECOMMENDED_TWIND_VERSION = "0.16.19";
export const RECOMMENDED_STD_VERSION = "0.187.0";

export function freshImports(imports: Record<string, string>) {
  imports["$fresh/"] = new URL("../../", import.meta.url).href;
  imports["preact"] = `https://esm.sh/preact@${RECOMMENDED_PREACT_VERSION}`;
  imports["preact/"] = `https://esm.sh/preact@${RECOMMENDED_PREACT_VERSION}/`;
  imports["preact-render-to-string"] =
    `https://esm.sh/*preact-render-to-string@${RECOMMENDED_PREACT_RTS_VERSION}`;
  imports["@preact/signals"] =
    `https://esm.sh/*@preact/signals@${RECOMMENDED_PREACT_SIGNALS_VERSION}`;
  imports["@preact/signals-core"] =
    `https://esm.sh/*@preact/signals-core@${RECOMMENDED_PREACT_SIGNALS_CORE_VERSION}`;
}

export function twindImports(imports: Record<string, string>) {
  imports["twind"] = `https://esm.sh/twind@${RECOMMENDED_TWIND_VERSION}`;
  imports["twind/"] = `https://esm.sh/twind@${RECOMMENDED_TWIND_VERSION}/`;
}

export function dotenvImports(imports: Record<string, string>) {
  imports["$std/"] = `https://deno.land/std@${RECOMMENDED_STD_VERSION}/`;
}
