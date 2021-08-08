/** @jsx h */

import { h, IS_BROWSER, useData } from "../deps.ts";

export default function Home() {
  const message = useData("home", (key) => {
    return new Promise<string>((resolve) => {
      setTimeout(() => resolve("Hello!"), 100);
    });
  });
  return (
    <div>
      <p>{message}</p>
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}
