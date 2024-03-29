import { useReducer } from "preact/hooks";

export default function Page() {
  useReducer(() => {}, undefined);
  return <h1>useReducer</h1>;
}
