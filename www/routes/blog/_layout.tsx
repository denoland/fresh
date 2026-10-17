import { layout } from "./$_layout.ts";
import { Head } from "fresh/runtime";

export default layout(({ Component }) => {
  return (
    <div class="layout">
      <Head>
        <link rel="stylesheet" href="/markdown.css" />
        <link rel="alternate" type="application/atom+xml" title="Fresh blog" href="/blog/feed" />
      </Head>
      <div class="bg-background-primary text-foreground-primary min-h-screen">
        <Component />
      </div>
    </div>
  );
});
