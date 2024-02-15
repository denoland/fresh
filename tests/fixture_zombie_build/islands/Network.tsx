import { useEffect, useRef } from "preact/hooks";
import { Network } from "https://esm.sh/vis-network@9.1.9/standalone";
import { IS_BROWSER } from "$fresh/runtime.ts";

export default function NetworkDiagram() {
  const container = useRef<HTMLDivElement>(null);
  const network = useRef<Network | null>(null);

  const nodes = [{ id: 1, label: "Node 1" }, { id: 2, label: "Node 2" }];
  const edges = [{ from: 1, to: 2 }];

  useEffect(() => {
    if (!container.current) return;
    // this check isn't necessary because this doesn't run on the server regardless
    // but this is the standard advice for not blocking the build, so i'll include it just to demonstrate
    if (IS_BROWSER || !Deno.args.includes("build")) {
      network.current = new Network(container.current, {
        nodes: nodes,
        edges: edges,
      }, {});
    }
  }, []);

  return (
    <div class="m-4 p-4 border border-sky-500">
      <div ref={container} />
    </div>
  );
}
