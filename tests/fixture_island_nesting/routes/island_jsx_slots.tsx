import IslandSlot from "../islands/IslandSlot.tsx";

export default function Home() {
  return (
    <div id="page">
      <IslandSlot slot={<p>it works</p>} />
    </div>
  );
}
