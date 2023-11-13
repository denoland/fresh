export default function Home() {
  const sub = "/sub";
  const subFoo = "/sub/foo";
  return (
    <ul>
      <li>
        <a href={sub}>links</a>
      </li>
      <li>
        <a href={subFoo}>sub/foo</a>
      </li>
    </ul>
  );
}
