export default function Page() {
  return (
    <div>
      <p>it doesn't work</p>
      <button // @ts-ignore - we don't officially recommend this, but lots of
       // apps pre Fresh 1.2 use string based click handlers.
      onClick="document.querySelector('p').textContent = 'it works'">
        click me
      </button>
    </div>
  );
}
