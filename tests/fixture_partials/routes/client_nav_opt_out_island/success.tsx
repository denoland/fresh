import { RouteConfig } from "$fresh/server.ts";
import CounterA from "../../islands/CounterA.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
};

export default function PageA() {
  return (
    <div>
      <h1 class="success">Success</h1>
      <CounterA />
    </div>
  );
}
