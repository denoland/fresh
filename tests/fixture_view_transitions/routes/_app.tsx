import { AppProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";

const anim = {
  old: [
    {
      name: "fadeOut",
      duration: "0.5s",
    },
    {
      name: "slideToLeft",
      duration: "0.5s",
    },
  ],
  new: [
    {
      name: "fadeIn",
      duration: "0.5s",
    },
    {
      name: "slideFromRight",
      duration: "0.5s",
    },
  ],
};

export default function App({ Component }: AppProps) {
  return (
    <div
      class="app"
      transition={{
        id: "app",
        backward: { new: anim.new, old: anim.old },
        forward: anim,
      }}
    >
      <Head>
        <link rel="stylesheet" href="/transition.css" />
      </Head>
      <Component />
    </div>
  );
}
