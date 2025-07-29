import { Bar } from "../islands/Bar.tsx";
import { Foo } from "../islands/Foo.tsx";

export const handler = (ctx) => {
  console.log((ctx.req as Request).referrer);
  return { data: {} };
};

export default function About() {
  return (
    <div>
      <h1>Hello from Cloudflare workers</h1>
      <p>This page is the prod Fresh build and served by wrangler</p>
      <Foo />
      <Bar />
    </div>
  );
}
