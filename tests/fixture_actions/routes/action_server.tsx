import helloAction from "../actions/hello.ts";

export default function Page() {
  return (
    <div id="page">
      <div use={helloAction("it works")}>it doesn't work</div>
    </div>
  );
}
