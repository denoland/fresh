import PassThrough from "../../islands/PassThrough.tsx";

export default function Home() {
  return (
    <div>
      <PassThrough>
        <>
          <h1 class="it-works">it works</h1>
          <>
            <h2 key="foo">even with keyed</h2>
          </>
        </>
      </PassThrough>
    </div>
  );
}
