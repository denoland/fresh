import { Head } from "$fresh/runtime.ts";
import { useEffect, useRef } from "preact/hooks";

export default function SearchButton(
  props: { docsearch: Function; class?: string },
) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      props.docsearch({
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
      <div
        title="Search Button"
        class={"h-9 mb-6 " + (props.class ?? "")}
        ref={ref}
      >
      </div>
    </>
  );
}
