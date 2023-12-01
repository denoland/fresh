self.onmessage = ({ data }) => {
  console.log("myFirstWorker received message:", data);
  self.postMessage("hello from myFirstWorker");
};
