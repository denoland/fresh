import { FancyLink } from "../../components/FancyLink.tsx";
import LemonTop from "../../islands/LemonTop.tsx";
import LemonBottom from "../../islands/LemonBottom.tsx";
import { CopyButton } from "../CopyButton.tsx";

export function Hero() {
  return (
    <>
      <div class="bg-green-300 mt-0 pt-32 md:pt-48 !mb-0 bg-gradient-to-br from-blue-100 via-green-200 to-yellow-100">
        <div class="md:grid grid-cols-5 gap-8 md:gap-16 items-center w-full max-w-screen-xl mx-auto px-4 md:px-8 lg:px-16 2xl:px-0">
          <div class="flex-1 text-center md:text-left md:col-span-3 pb-8 md:pb-32">
            <h2 class="text-[calc(1rem+4vw)] leading-tight sm:text-5xl lg:text-6xl sm:tracking-tight sm:leading-none font-extrabold">
              The simple, approachable, productive web framework
            </h2>
            <div class="mt-12 flex flex-wrap justify-center items-stretch md:justify-start gap-4">
              <FancyLink href="/docs/getting-started">Get started</FancyLink>
              <CopyArea code={`deno run -Ar jsr:@fresh/init`} />
            </div>
          </div>
          <div class="md:col-span-2 flex justify-center items-end">
            <LemonTop />
          </div>
        </div>
      </div>
      <LemonBottom />
    </>
  );
}

function CopyArea(props: { code: string }) {
  return (
    <div class="bg-slate-800 rounded-sm text-green-100 flex items-center min-w-0 overflow-x-auto">
      <pre class="overflow-x-auto w-full flex-1 px-6 py-4">
        {props.code}
      </pre>

      <CopyButton code={props.code} />
    </div>
  );
}
