import { useSignal } from "@preact/signals";
import { useEffect } from "preact/hooks";

export default function LazyLink(props: { links: string[] }) {
  const sig = useSignal(false);

  useEffect(() => {
    sig.value = true;
  }, []);

  return (
    <div class="island">
      {sig.value
        ? (
          <ul class="revived">
            {props.links.map((link) => {
              return (
                <li key={link}>
                  <a href={link}>{link}</a>
                </li>
              );
            })}
          </ul>
        )
        : null}
    </div>
  );
}
