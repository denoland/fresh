import { h, IS_BROWSER, useState } from "../deps.ts";

export default function Home() {
  return (
    <div>
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}
