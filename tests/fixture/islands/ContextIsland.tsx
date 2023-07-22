import { useContext, useEffect, useState } from "preact/hooks";
import { SharedContext } from "$fresh/tests/fixture/components/SharedContext.tsx";

export default function ContextIsland() {
  const value = useContext(SharedContext);
  const [showClient, setShowClient] = useState(false);

  useEffect(() => {
    console.log("effect");
    setShowClient(true);
  }, []);

  return (
    <div class="island">
      <p class="server-render">Context value: {value}</p>
      {showClient && <p class="client-render">Context value: {value}</p>}
    </div>
  );
}
