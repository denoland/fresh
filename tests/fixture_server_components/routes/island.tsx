import FooIsland from "../islands/FooIsland.tsx";

export default async function Island() {
  await new Promise((r) => setTimeout(r, 10));
  return <FooIsland />;
}
