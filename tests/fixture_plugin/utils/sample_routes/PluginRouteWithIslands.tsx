import Island from "../../islands/Island.tsx";
import IslandFromPlugin from "../sample_islands/IslandFromPlugin.tsx";
import Island2FromPlugin from "../sample_islands/sub/Island2FromPlugin.tsx";

export default function IslandsPluginComponent() {
  return (
    <div>
      <Island />
      <IslandFromPlugin />
      <Island2FromPlugin />
    </div>
  );
}
