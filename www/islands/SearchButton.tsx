import { Head } from "$fresh/runtime.ts";
import { useEffect, useRef } from "preact/hooks";
import docsearch from "https://esm.sh/@docsearch/js@3";

export default function SearchButton() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      docsearch({
        appId: "CWUS37S0PK",
        apiKey: "caa591b6dcb2c9308551361d954a728b",
        indexName: "fresh",
        container: ref.current,
      });
    }
  }, [ref.current]);
  return (
    <>
      <Head>
        <link
          rel="stylesheet"
          href="/docsearch.css"
        />
      </Head>
      <div class="h-9 mb-6" ref={ref}></div>
    </>
  );
}
