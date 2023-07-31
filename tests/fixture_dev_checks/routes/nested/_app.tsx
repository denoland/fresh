import { AppProps } from "$fresh/server.ts";

export default function App(props: AppProps) {
  return (
    <>
      <props.Component />
    </>
  );
}
