import { Head } from "$fresh/runtime.ts";

export default function Home() {
  return (
    <div class="home-page">
      <Head>
        <title>Home</title>
      </Head>
      <h1>Home</h1>
      <a href="/other">other</a>
    </div>
  );
}
