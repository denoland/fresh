import { useEffect, useState } from "preact/hooks";

export default function IslandWithProps(
  props: { foo: { bar: string } },
) {
  const [showText, setShowText] = useState(false);

  useEffect(() => {
    setShowText(true);
  }, []);

  return (
    <div class="island">
      <p>
        {showText ? props.foo.bar : "it doesn't work"}
      </p>
    </div>
  );
}
