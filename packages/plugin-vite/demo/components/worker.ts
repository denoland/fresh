self.onmessage = (event) => {
  // deno-lint-ignore no-console
  console.log("worker", event);
  self.postMessage("ok");
};
