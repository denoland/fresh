import { Foo } from "./(_islands)/Foo.tsx";
import { Foo as Foo2 } from "../foo/(_islands)/Foo.tsx";

export default function Home() {
  return (
    <div>
      <Foo />
      <Foo2 />
    </div>
  );
}
