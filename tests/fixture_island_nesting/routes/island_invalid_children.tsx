import { PassThrough } from "../islands/PassThrough.tsx";

export default function Page() {
  return (
    <div id="page">
      <PassThrough>{{ foo: 123 }}</PassThrough>
    </div>
  );
}
