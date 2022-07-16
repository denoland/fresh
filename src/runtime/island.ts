import { createContext } from "preact";
import { useContext } from "preact/hooks";

export const ISLAND_CONTEXT = createContext<boolean>(false);

export function useWithinIsland() {
  const ctx = useContext(ISLAND_CONTEXT);

  if (ctx === undefined) {
    throw new Error(
      "useWithinIsland must be used within an ISLAND_CONTEXT.Provider",
    );
  }

  return ctx;
}
