export type Dispose = () => void;
export type Directive<T, N = HTMLElement> = (
  node: N,
  params: T,
) => void | Dispose;
export interface DirectiveDef<T, N = HTMLElement> {
  name: string;
  fn: Directive<T, N>;
}

export function directive<T = unknown, N = HTMLElement>(
  name: string,
  fn: Directive<T, N>,
): (params: T) => DirectiveDef<T, N> {
  return (params: T) => {
    return { name, params, fn };
  };
}

const a = directive<{ foo: number }, HTMLInputElement>(
  "foo",
  (node, params) => {
    console.log("sub");
    return () => console.log("unsub");
  },
);

const def = a({ foo: 2 });

const flip = directive("flip", (node) => {
});
