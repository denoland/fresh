export default function Home() {
  const sub = "/sub-dynamic";
  const subFoo = "/sub-dynamic/foo";
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
