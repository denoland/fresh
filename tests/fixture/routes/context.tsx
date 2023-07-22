import { SharedContext } from "$fresh/tests/fixture/components/SharedContext.tsx";
import ContextIsland from "$fresh/tests/fixture/islands/ContextIsland.tsx";

export default function PreactContext() {
  return (
    <SharedContext.Provider value={42}>
      <ContextIsland />
    </SharedContext.Provider>
  );
}
