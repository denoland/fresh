import { useEffect } from "preact/hooks";

export default function ReturningNull() {
  useEffect(() => {
    const p = document.createElement("p");
    p.textContent = "Hello, null!";
    p.className = "added-by-use-effect";

    document.body.appendChild(p);
  }, []);

  return null;
}
