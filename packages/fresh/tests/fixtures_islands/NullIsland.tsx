import { useEffect } from "preact/hooks";

export function NullIsland() {
  useEffect(() => {
    const div = document.createElement("div");
    div.className = "ready";
    document.body.appendChild(div);
  }, []);
  return null;
}
