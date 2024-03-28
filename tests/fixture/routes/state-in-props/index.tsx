import type { Handlers, PageProps } from "$fresh/server.ts";
import type { TestState } from "../_app.tsx";

export const handler: Handlers<boolean> = {
  GET(_, ctx) {
    const complexValue = true;
    return ctx.render(complexValue);
  },
};

export default function Page(props: PageProps<boolean, TestState>) {
  let valueFromState = props.state.stateInProps;
  if (props.data) {
    valueFromState = valueFromState.toUpperCase();
  }
  return (
    <div>
      <h1>{valueFromState}</h1>
    </div>
  );
}
