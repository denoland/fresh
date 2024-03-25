export const RECOMMENDED_PREACT_VERSION = "10.19.6";
export const RECOMMENDED_PREACT_SIGNALS_VERSION = "1.2.2";
export const RECOMMENDED_PREACT_SIGNALS_CORE_VERSION = "1.5.1";
export const RECOMMENDED_TWIND_CORE_VERSION = "1.1.3";
export const RECOMMENDED_TWIND_PRESET_AUTOPREFIX_VERSION = "1.0.7";
export const RECOMMENDED_TWIND_PRESET_TAILWIND_VERSION = "1.1.4";
export const RECOMMENDED_STD_VERSION = "0.216.0";
export const RECOMMENDED_TAILIWIND_VERSION = "3.4.1";

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
  imports["@twind/core"] =
    `https://esm.sh/@twind/core@${RECOMMENDED_TWIND_CORE_VERSION}`;
  imports["@twind/preset-tailwind"] =
    `https://esm.sh/@twind/preset-tailwind@${RECOMMENDED_TWIND_PRESET_TAILWIND_VERSION}/`;
  imports["@twind/preset-autoprefix"] =
    `https://esm.sh/@twind/preset-autoprefix@${RECOMMENDED_TWIND_PRESET_AUTOPREFIX_VERSION}/`;
}

export function tailwindImports(imports: Record<string, string>) {
  imports["tailwindcss"] = `npm:tailwindcss@${RECOMMENDED_TAILIWIND_VERSION}`;
  imports["tailwindcss/"] =
    `npm:/tailwindcss@${RECOMMENDED_TAILIWIND_VERSION}/`;
  imports["tailwindcss/plugin"] =
    `npm:/tailwindcss@${RECOMMENDED_TAILIWIND_VERSION}/plugin.js`;
}

export function dotenvImports(imports: Record<string, string>) {
  imports["$std/"] = `https://deno.land/std@${RECOMMENDED_STD_VERSION}/`;
}
