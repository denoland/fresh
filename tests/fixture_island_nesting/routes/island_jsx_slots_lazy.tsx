import IslandSlotConditional from "../islands/IslandSlotConditional.tsx";

export default function Home() {
  return (
    <div id="page">
      <IslandSlotConditional slot={<p>it works</p>} />
    </div>
  );
}
