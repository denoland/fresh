/** @jsx h */
import { h } from "preact";
import Counter from "./Counter.tsx";

interface TopLevelOuterProps {
  start: number;
  id: string;
}

export default function TopLevelOuter(props: TopLevelOuterProps) {
  return <Counter {...props} />;
}
