import IslandWithProps from "../islands/IslandWithProps.tsx";
import Island from "../islands/Island.tsx";

export default function Home() {
  return (
    <div id="page">
      <Island>
        <IslandWithProps foo={{ bar: "it works" }} />
      </Island>
    </div>
  );
}
