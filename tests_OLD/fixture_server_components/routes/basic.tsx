export default async function Home() {
  await new Promise((r) => setTimeout(r, 10));
  return <h1>it works</h1>;
}
