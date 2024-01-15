import { useEffect, useState } from "preact/hooks";

export default function DangerousIsland(props: { raw: string }) {
  const [css, set] = useState("");
  useEffect(() => {
    set("raw_ready");
  }, []);

  return <div class={css} dangerouslySetInnerHTML={{ __html: props.raw }} />;
}
