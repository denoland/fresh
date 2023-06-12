import Passthrough from "../islands/Passthrough.tsx";

function Foo() {
  return <p class="FOO">This is server</p>;
}

export default function PassthroughPage() {
  return (
    <div>
      <Passthrough>
        <div style="padding: 2rem; border: 2px solid red">
          <Foo />
        </div>
      </Passthrough>
      <div>
        <h2>DEBUG</h2>
        <div id="debug"></div>
      </div>
    </div>
  );
}
