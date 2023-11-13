export const RECOMMENDED_PREACT_VERSION = "10.19.1";
export const RECOMMENDED_PREACT_SIGNALS_VERSION = "1.2.1";
export const RECOMMENDED_PREACT_SIGNALS_CORE_VERSION = "1.5.0";
export const RECOMMENDED_TWIND_VERSION = "0.16.19";
export const RECOMMENDED_STD_VERSION = "0.205.0";

export function freshImports(imports: Record<string, string>) {
  imports["$fresh/"] = new URL("../../", import.meta.url).href;
  imports["preact"] = `https://esm.sh/preact@${RECOMMENDED_PREACT_VERSION}`;
  imports["preact/"] = `https://esm.sh/preact@${RECOMMENDED_PREACT_VERSION}/`;
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
