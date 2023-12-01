self.onmessage = ({ data }) => {
  console.log("secondWorker received message:", data);
  self.postMessage("sending from secondWorker");
};
