import { UnknownPageProps } from "$fresh/server.ts";

type Data = { hello: string };
type State = { root: string };

export default function NotFoundPage(
  { data, state, url }: UnknownPageProps<Data | undefined, State>,
) {
  // Checks that we have the correct type for state
  state.root satisfies string;

  return (
    <>
      <p>404 not found: {url.pathname}</p>
      {data?.hello && <p>Hello {data.hello}</p>}
      <p>State root: {state.root}</p>
    </>
  );
}
