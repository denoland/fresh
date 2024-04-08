import { defineRoute, RouteConfig } from "$fresh/server.ts";
import { IsPartialInContextState } from "./_middleware.ts";
import { Partial } from "$fresh/runtime.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default defineRoute<IsPartialInContextState>((req, ctx) => {
  const result = {
    isPartial: ctx.isPartial,
    setFromMiddleware: ctx.state.setFromMiddleware,
    notSetFromMiddleware: ctx.state.notSetFromMiddleware,
  };
  if (ctx.isPartial) {
    return (
      <Partial name="slot-1">
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </Partial>
    );
  }
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
});
