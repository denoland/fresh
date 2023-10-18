import { PageProps } from "$fresh/server.ts";

// deno-lint-ignore require-await
export default async function SlotDemo(req: Request) {
  const update = new URL(req.url).searchParams.has("swap");

  return (
    <>
      {!update && (
        <h2>
          Featured products
        </h2>
      )}
      <div>
        <p>
          content
        </p>
      </div>
    </>
  );
}
