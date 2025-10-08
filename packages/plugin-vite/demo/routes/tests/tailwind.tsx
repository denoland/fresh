import { Head } from "fresh/runtime";

export default function Page() {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <h1 class="text-red-500">this should be red</h1>
    </>
  );
}
