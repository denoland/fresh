import { Head } from "$fresh/runtime.ts";

export default function Page() {
  return (
    <>
      <Head>
        <link rel="stylesheet" href="/style.css" />
      </Head>
      <div>
        <div id="script-output" />
        <script src="/script.js"></script>
        <img class="img" src="/img.png" alt="" />
        <img
          class="img-srcset"
          src="/img.png"
          srcset="/img.png 480w, /img.png 800w"
          alt=""
        />
        <picture>
          <source srcset="/img.png" media="(min-width: 600px)" />
          <img src="/img.png" alt="MDN" />
        </picture>
        <p class="foo">css style</p>
      </div>
    </>
  );
}
