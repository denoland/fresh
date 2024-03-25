import { PassThrough } from "../islands/PassThrough.tsx";

function Foo() {
  return <h1>foo</h1>;
}

export default function Page() {
  return (
    <div id="page">
      <PassThrough>hello</PassThrough>
      <PassThrough>{2}</PassThrough>
      <PassThrough>{null}</PassThrough>
      <PassThrough>{true}</PassThrough>
      <PassThrough>{false}</PassThrough>
      <PassThrough>{undefined}</PassThrough>
      <PassThrough>
        <h1>hello</h1>
      </PassThrough>
      <PassThrough>
        <Foo />
      </PassThrough>
    </div>
  );
}
