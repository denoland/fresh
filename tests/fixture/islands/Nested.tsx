/** @jsx h */
import { h } from "preact";
import Counter from "./Counter.tsx";

export default function Nesting({ id, start }: { id: string; start: number }) {
  return <Counter id={id} start={start} />;
}
