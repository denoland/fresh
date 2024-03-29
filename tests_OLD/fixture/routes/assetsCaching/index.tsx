import Test from "../../islands/Test.tsx";

export default function Home() {
  return (
    <div>
      <div style={{ marginTop: 20 }}>img-with-hashing</div>
      <img id="img-with-hashing" src="/image.png" height={130} />

      <div style={{ marginTop: 20 }}>img-without-hashing</div>
      <img
        id="img-without-hashing"
        src="/image.png"
        data-fresh-disable-lock
        height={130}
      />

      <Test message="In island" />

      <div style={{ marginTop: 20 }}>img-external</div>
      <img
        id="img-missing"
        src="https://fresh.deno.dev/favicon.ico"
        height={130}
      />
    </div>
  );
}
