import type { Handlers, PageProps, RouteConfig } from "$fresh/server.ts";
import type { IsPartialInContextState } from "./_middleware.ts";
import { Partial } from "@fresh/runtime";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export const handler: Handlers = {
  GET(_req, ctx) {
    return ctx.render(ctx.isPartial);
  },
};

export default function Home(
  props: PageProps<boolean, IsPartialInContextState>,
) {
  const result = {
    isPartial: props.data,
    setFromMiddleware: props.state.setFromMiddleware,
    notSetFromMiddleware: props.state.notSetFromMiddleware,
  };
  if (props.data) {
    return (
      <Partial name="slot-1">
        <pre>{JSON.stringify(result, null, 2)}</pre>
      </Partial>
    );
  }
  return <pre>{JSON.stringify(result, null, 2)}</pre>;
}
