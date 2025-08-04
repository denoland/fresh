import { Bar } from "../islands/Bar.tsx";
import { Foo } from "../islands/Foo.tsx";

export const handler = () => {
  return { data: {} };
};

export default function About() {
  return (
    <div>
      <h1>Hello from Vite</h1>
      <p>This page is the prod Fresh build and served by vite</p>
      <Foo />
      <Bar />
    </div>
  );
}
