import { Handlers, PageProps } from "$fresh/server.ts";

export const handler: Handlers<boolean> = {
  GET(_, ctx) {
    const complexValue = true;
    return ctx.render(complexValue);
  },
};

export default function Page(props: PageProps<boolean>) {
  let valueFromState = props.state.stateInProps as string;
  if (props.data) {
    valueFromState = valueFromState.toUpperCase();
  }
  return (
    <div>
      <h1>{valueFromState}</h1>
    </div>
  );
}
