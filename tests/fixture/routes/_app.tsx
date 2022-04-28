/** @jsx h */
/** @jsxFrag Fragment */

import { AppProps, Fragment, h, Head } from "../deps.client.ts";

export default function App(props: AppProps) {
  return (
    <>
      <Head>
        <meta name="description" content="Hello world!" />
      </Head>
      <props.Component />
    </>
  );
}
