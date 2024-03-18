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

export const AOT_GH_ACTION = `name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: main

jobs:
  deploy:
    name: Deploy
    runs-on: ubuntu-latest

    permissions:
      id-token: write # Needed for auth with Deno Deploy
      contents: read # Needed to clone the repository

    steps:
      - name: Clone repository
        uses: actions/checkout@v4

      - name: Install Deno
        uses: denoland/setup-deno@v1
        with:
          deno-version: v1.x

      - name: Build step
        run: "deno task build" # 📝 Update the build command(s) if necessary

      - name: Upload to Deno Deploy
        uses: denoland/deployctl@v1
        with:
          project: "example-project" # 📝 Update the deploy project name if necessary
          entrypoint: "./main.ts" # 📝 Update the entrypoint if necessary
`;
