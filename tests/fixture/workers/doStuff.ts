self.onmessage = ({ data }) => {
  console.log("doStuff says:", data);
  self.postMessage("doStuff reporting for duty");
};
