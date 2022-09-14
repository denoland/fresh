export const RECOMMENDED_PREACT_VERSION = "10.11.0";
export const RECOMMENDED_PREACT_RTS_VERSION = "5.2.4";
export const RECOMMENDED_PREACT_SIGNALS_VERSION = "1.0.3";
export const RECOMMENDED_PREACT_SIGNALS_CORE_VERSION = "1.0.1";
export const RECOMMENDED_TWIND_VERSION = "0.16.17";

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
