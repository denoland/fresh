import { Head } from "$fresh/runtime.ts";

const bar = "bar";

export default function Page() {
  return (
    <div>
      <Head>
        <title>foo</title>
        <meta key="foo" name="foo" content="bar" />
        <meta name="og:foo" content={bar} />
      </Head>
      <h1>Hello World</h1>
    </div>
  );
}
