import { useEffect, useState } from "preact/hooks";
import { ComponentChildren } from "preact";

export default function IslandSlotConditional(
  props: { slot?: ComponentChildren },
) {
  const [v, set] = useState(false);
  useEffect(() => {
    set(true);
  }, []);

  console.log("island", v && props.slot);

  return (
    <div class="island">
      {v ? props.slot : <p>not working</p>}
    </div>
  );
}
