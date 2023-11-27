import { RouteConfig } from "$fresh/server.ts";
import { Partial } from "$fresh/runtime.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default function Home() {
  return (
    <Partial name="slot-1">
      <p class="status-updated">Updated content</p>
    </Partial>
  );
}
