import { Head } from "$fresh/runtime.ts";

export default function Page() {
  return (
    <div>
      <Head>
        <title>foo</title>
        <meta name="foo" content="bar" />
      </Head>
      <h1>Hello World</h1>
    </div>
  );
}
