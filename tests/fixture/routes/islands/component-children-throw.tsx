import { ComponentChildren } from "preact";
import PassThrough from "../../islands/PassThrough.tsx";

function Foo({ children }: { children: ComponentChildren }) {
  return <div>{children}</div>;
}

export default function Home() {
  return (
    <div>
      <PassThrough>
        <Foo>should throw</Foo>
      </PassThrough>
    </div>
  );
}
