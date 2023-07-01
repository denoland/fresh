import lifecycle from "../actions/lifecycle.ts";

export default function Page() {
  return (
    <div id="page">
      <pre id="out" />
      <div use={lifecycle("it works")} />
    </div>
  );
}
