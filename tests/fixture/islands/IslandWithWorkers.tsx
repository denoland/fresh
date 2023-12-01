import { useEffect, useRef } from "preact/hooks";
import useWorker from "../utils/useWorker.ts";

export default function IslandWithWorkers() {
  const firstWorkerRef = useRef<Worker | null>(null);
  const secondWorkerRef = useWorker("../workers/secondWorker.ts");

  useEffect(() => {
    firstWorkerRef.current = new Worker(
      new URL("../workers/myFirstWorker.ts", import.meta.url),
      { type: "module" },
    );

    if (firstWorkerRef.current) {
      firstWorkerRef.current.postMessage("send first message to myFirstWorker");
      firstWorkerRef.current.onmessage = ({ data }) => {
        console.log("received in main for first worker:", data);
      };
    }

    if (secondWorkerRef.current) {
      secondWorkerRef.current.postMessage("message to secondWorker");
      secondWorkerRef.current.onmessage = ({ data }) => {
        console.log("received in main for second worker:", data);
      };
    }

    return () => {
      if (firstWorkerRef.current) {
        firstWorkerRef.current.terminate();
      }
      firstWorkerRef.current = null;

      if (secondWorkerRef.current) {
        secondWorkerRef.current.terminate();
      }
      secondWorkerRef.current = null;
    };
  }, []);

  return <div>hello from the first island</div>;
}
