import { RouteConfig } from "$fresh/server.ts";
import { OptOutLink } from "$fresh/tests/fixture_partials/islands/OptOutLink.tsx";
import CounterA from "../../islands/CounterA.tsx";

export const config: RouteConfig = {
  skipAppWrapper: true,
};

export default function ModeDemo() {
  return (
    <div>
      <OptOutLink
        href="/client_nav_opt_out_island/success"
        partial="/client_nav_opt_out_island/partial"
      />
      <CounterA />
    </div>
  );
}
