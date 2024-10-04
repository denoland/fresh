import { RouteConfig } from "$fresh/server.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
};

export default function PageA() {
  return <h1 class="fail">FAIL</h1>;
}
