const arr = ["/lemon-squash.svg"];

export default function Home() {
  return (
    <div>
      <p>static</p>
      <img src="/lemon-squash.svg" alt="" />
      <p>dynamic</p>
      <img src={arr[0]} alt="" />
    </div>
  );
}
