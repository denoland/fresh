const arr = ["/lemon-squash.svg 480w, /lemon-squash.svg 800w"];

export default function Home() {
  return (
    <div>
      <p>static</p>
      <img srcset="/lemon-squash.svg 480w, /lemon-squash.svg 800w" alt="" />
      <p>dynamic</p>
      <img srcset={arr[0]} alt="" />
    </div>
  );
}
