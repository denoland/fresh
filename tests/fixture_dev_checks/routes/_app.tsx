import { AppProps } from "$fresh/server.ts";

export function App(props: AppProps) {
  return (
    <>
      <props.Component />
    </>
  );
}
