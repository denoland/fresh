import MyWorker from "../../components/worker?worker&url";

export default async function Page() {
  console.log("worker url", MyWorker);
  const worker = new Worker(new URL(MyWorker, import.meta.url), {
    type: "module",
  });

  const p = Promise.withResolvers<string>();

  worker.addEventListener("message", (ev) => {
    p.resolve(ev.data);
  });
  worker.postMessage("hey");

  const value = await p.promise;
  return <h1>{value}</h1>;
}
