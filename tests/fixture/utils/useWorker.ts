import { useEffect, useRef } from "preact/hooks";

export default function useWorker(workerPath: string) {
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL(workerPath, location.href), {
      type: "module",
    });

    const worker = workerRef.current;

    if (worker) {
      worker.postMessage("hook helped here");
      worker.onmessage = ({ data }) => {
        console.log("this is from the hook:", data);
      };
    }

    return () => {
      if (worker) {
        worker.terminate();
      }
      workerRef.current = null;
    };
  }, [workerPath]);

  return workerRef;
}
