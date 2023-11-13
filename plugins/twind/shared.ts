import "preact";
import { Configuration } from "twind";

export interface Options extends Omit<Configuration, "mode" | "sheet"> {
  /** The import.meta.url of the module defining these options. */
  selfURL: string;
}

declare module "preact" {
  namespace JSX {
    interface DOMAttributes<Target extends EventTarget> {
      class?: string;
      className?: string;
    }
  }
}

export const STYLE_ELEMENT_ID = "__FRSH_TWIND";
