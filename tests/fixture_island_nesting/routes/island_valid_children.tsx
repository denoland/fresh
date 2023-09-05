import { PassThrough } from "../islands/PassThrough.tsx";

export default function Page() {
  return (
    <div id="page">
      <PassThrough>hello</PassThrough>
      <PassThrough>{2}</PassThrough>
      <PassThrough>{null}</PassThrough>
      <PassThrough>{true}</PassThrough>
      <PassThrough>{false}</PassThrough>
    </div>
  );
}
