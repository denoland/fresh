import { launch, type Page } from "@astral/astral";

const browser = await launch({
  args: [
    "--window-size=1280,720",
    ...((Deno.env.get("CI") && Deno.build.os === "linux")
      ? ["--no-sandbox"]
      : []),
  ],
  headless: Deno.env.get("HEADLESS") !== "false",
});

export async function withBrowser(
  fn: (page: Page) => void | Promise<void>,
): Promise<void> {
  await using page = await browser.newPage();
  try {
    await fn(page);
  } catch (err) {
    const raw = await page.content();
    // deno-lint-ignore no-console
    console.log(raw);
    throw err;
  }
}

type AppLike = { handler(): unknown };

function isAppLike(x: unknown): x is AppLike {
  return typeof (x as AppLike)?.handler === "function";
}

export async function withBrowserApp(
  appOrHandler: Deno.ServeHandler | AppLike,
  fn: (page: Page, address: string) => void | Promise<void>,
): Promise<void> {
  const handler =
    (isAppLike(appOrHandler)
      ? appOrHandler.handler()
      : appOrHandler) as Deno.ServeHandler;
  const aborter = new AbortController();
  await using server = Deno.serve({
    hostname: "localhost",
    port: 0,
    signal: aborter.signal,
    onListen: () => {},
  }, handler);

  try {
    await using page = await browser.newPage();
    await fn(page, `http://localhost:${server.addr.port}`);
  } finally {
    aborter.abort();
  }
}
