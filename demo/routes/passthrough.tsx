import { ComponentChildren } from "preact";
import Passthrough from "@/islands/Passthrough.tsx";

export interface FooProps {
  children?: ComponentChildren;
  n: number;
}

function Foo(props: FooProps) {
  return (
    <div style="background: #e6afaf; border: 4px solid red; border-radius: .5rem; padding: 1rem; margin: 1rem;">
      <h2 class="foobar">This is static server content: #{props.n}</h2>
      <h3 class="foobar">This is static server content: #{props.n}</h3>
      {props.children}
    </div>
  );
}

export default function PassthroughPage() {
  return (
    <div style="padding: 2rem">
      <h2>Single</h2>
      <Passthrough n={1}>
        <Foo n={1} />
      </Passthrough>

      <h2>Nested</h2>
      <Passthrough n={2}>
        <Foo n={2}>
          <Passthrough n={3}>
            <Foo n={3}>
              <Passthrough n={4}>
                <Foo n={4} />
              </Passthrough>
            </Foo>
          </Passthrough>
          <Passthrough n={5}>
            <Foo n={5}>
              <Passthrough n={6}>
                <Foo n={6} />
              </Passthrough>
            </Foo>
          </Passthrough>
        </Foo>
      </Passthrough>

      <h2>Island in Island</h2>
      <Passthrough n={4}>
        <Passthrough n={5}>
          <Foo n={4} />
        </Passthrough>
      </Passthrough>
    </div>
  );
}
