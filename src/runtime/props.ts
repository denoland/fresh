import { useContext } from "preact/hooks";
import { createContext } from "preact";
import { PageProps } from "../server/types.ts";

export const PROPS_CONTEXT = createContext<PageProps>({
  url: new URL("https://fresh.deno.dev/"),
  route: "",
  params: {},
  data: undefined,
  state: {},
});

export function useProps() {
  try {
    return useContext(PROPS_CONTEXT);
  } catch (err) {
    throw new Error("useProps not available.", { cause: err });
  }
}
