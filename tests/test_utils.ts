import { Browser } from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { delay, Page, puppeteer, TextLineStream } from "./deps.ts";

export async function startFreshServer(options: Deno.CommandOptions) {
  const serverProcess = new Deno.Command(Deno.execPath(), {
    ...options,
    stdin: "null",
    stdout: "piped",
    stderr: "inherit",
  }).spawn();

  const decoder = new TextDecoderStream();
  const lines: ReadableStream<string> = serverProcess.stdout
    .pipeThrough(decoder)
    .pipeThrough(new TextLineStream(), {
      preventCancel: true,
    });

  let address = "";
  for await (const line of lines) {
    const match = line.match(/https?:\/\/localhost:\d+/g);
    if (match) {
      address = match[0];
      break;
    }
  }
  if (!address) {
    throw new Error("Server didn't start up");
  }

  return { serverProcess, lines, address };
}

// @ts-ignore: fix types here
// deno-lint-ignore no-explicit-any
let PUPPETEER_BROWSER: any = undefined;
export async function launchOrGetBrowser() {
  if (PUPPETEER_BROWSER) {
    return PUPPETEER_BROWSER;
  }

  const start = Date.now();
  console.log("starting browser");
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  console.log("browser started in", Date.now() - start, "ms");
  PUPPETEER_BROWSER = browser;
  return browser;
}

export async function closeBrowser() {
  if (typeof PUPPETEER_BROWSER !== "undefined") {
    await PUPPETEER_BROWSER.close();
  }
}

export async function withPageName(
  name: string,
  fn: (page: Page, address: string) => Promise<void>,
) {
  const { lines, serverProcess, address } = await startFreshServer({
    args: ["run", "-A", name],
  });

  try {
    await delay(100);
    const browser = await launchOrGetBrowser();

    const page = await browser.newPage();
    await fn(page, address);
  } finally {
    await lines.cancel();

    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;
  }
}
