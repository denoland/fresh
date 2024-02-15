import { Head } from "$fresh/runtime.ts";
import Network from "../islands/Network.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="styles.css" />
      </Head>
      <Network />
    </>
  );
}
