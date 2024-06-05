import { page } from "fresh";
import { PageSection } from "../components/PageSection.tsx";
import { DemoBox } from "../components/homepage/DemoBox.tsx";
import { define } from "../utils/state.ts";

export const handler = define.handlers({
  GET(ctx) {
    const url = new URL(ctx.req.url);
    const search = new URLSearchParams(url.search);
    const vote = search.get("vote");
    return page({ vote });
  },
});

export default define.page<typeof handler>(function ThanksForSubscribing(
  props,
) {
  const vote = props.data.vote ? props.data.vote.replaceAll(/-/g, " ") : null;
  return (
    <>
      <PageSection>
        <DemoBox>
          <div class="space-y-2">
            <h1 class="text-2xl md:text-3xl lg:text-4xl">
              {vote
                ? `Thanks for voting for ${vote}!`
                : `Form submitted successfully`}
            </h1>
            <p>
              That was all handled server-side, with{" "}
              <strong>no client-side JavaScript</strong>! Nifty, huh?
            </p>
            <p class="!mt-8">
              …Anyway, you probably want to{" "}
              <a href="/#forms-section" class="underline">go back now</a>.
            </p>
            <a
              href="/#forms-section"
              class="flex items-center gap-2 max-w-max !mt-4 mx-auto pt-3 pb-2 px-4 border-[1.5px] border-current rounded"
            >
              <svg
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                class="icon icon-tabler icon-tabler-arrow-right relative bottom-[0.05em] transition-transform ease-out duration-150"
                width="1em"
                height="1em"
                viewBox="0 0 24 24"
                stroke-width="3"
                stroke="currentColor"
                fill="none"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="transform:rotateY(180deg);"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M5 12l14 0" />
                <path d="M13 18l6 -6" />
                <path d="M13 6l6 6" />
              </svg>
              Back
            </a>
          </div>
        </DemoBox>
      </PageSection>
    </>
  );
});
