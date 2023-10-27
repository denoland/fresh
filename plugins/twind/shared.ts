import { Configuration, setup as twSetup, Sheet } from "twind";

export const STYLE_ELEMENT_ID = "__FRSH_TWIND";

export interface Options extends Omit<Configuration, "mode" | "sheet"> {
  /** The import.meta.url of the module defining these options. */
  selfURL: string;
}

export function setup(options: Options, sheet: Sheet) {
  twSetup({
    ...options,
    mode: "silent",
    sheet,
  });
}
