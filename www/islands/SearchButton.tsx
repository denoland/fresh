import { useEffect, useRef } from "preact/hooks";
import docsearch from "docsearch";

// Copied from algolia source code
type DocSearchProps = {
  appId: string;
  apiKey: string;
  indexName: string;
  container: HTMLElement | string;
};

export default function SearchButton(
  props: { docsearch?: (args: DocSearchProps) => void; class?: string },
) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      props.docsearch || docsearch({
        appId: "CWUS37S0PK",
        apiKey: "caa591b6dcb2c9308551361d954a728b",
        indexName: "fresh",
        container: ref.current,
      });
    }
  }, [ref.current]);
  return (
    <div
      title="Search Button"
      class={"h-9 mb-6 " + (props.class ?? "")}
      ref={ref}
    >
    </div>
  );
}
