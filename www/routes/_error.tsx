import { HttpError, PageProps } from "@fresh/core";
import LemonDrop from "../islands/LemonDrop.tsx";

export function ServerCodePage(
  props: { serverCode: number; codeDescription: string },
) {
  return (
    <>
      <section>
        <div class="w-full flex justify-center items-center flex-col bg-green-300">
          <LemonDrop />
        </div>
        <div class="text-center">
          <h1 class="text-6xl md:text-9xl font-extrabold">
            {props.serverCode}
          </h1>

          <p class="p-4 text-2xl md:text-3xl">
            {props.codeDescription}
          </p>

          <p class="p-4">
            <a href="/" class="hover:underline">Back to the Homepage</a>
          </p>
        </div>
      </section>
    </>
  );
}

export default function PageNotFound(props: PageProps) {
  const error = props.error;
  if (error instanceof HttpError) {
    if (error.status === 404) {
      return ServerCodePage({
        serverCode: 404,
        codeDescription: "Couldn’t find what you’re looking for.",
      });
    }
  }

  return ServerCodePage({
    serverCode: 500,
    codeDescription: "Oops! Something went wrong.",
  });
}
