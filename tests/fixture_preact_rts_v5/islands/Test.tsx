import { useEffect } from "preact/hooks";

export default function Test() {
  useEffect(() => {
    document.getElementById("foo")!.textContent = "it works";
  }, []);

  return (
    <p id="foo">
      it doesn't work
    </p>
  );
}
