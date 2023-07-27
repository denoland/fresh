import { delay, DOMParser, Page, puppeteer, TextLineStream } from "./deps.ts";

export function parseHtml(input: string) {
  return new DOMParser().parseFromString(input, "text/html");
}

export async function startFreshServer(options: Deno.CommandOptions) {
  const { serverProcess, lines, address } = await spawnServer(options);

  if (!address) {
    throw new Error("Server didn't start up");
  }

  return { serverProcess, lines, address };
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
    const browser = await puppeteer.launch({ args: ["--no-sandbox"] });

    try {
      const page = await browser.newPage();
      await fn(page, address);
    } finally {
      await browser.close();
    }
  } finally {
    await lines.cancel();

    serverProcess.kill("SIGTERM");

    // Wait until the process exits
    await serverProcess.status;
  }
}

export async function startFreshServerExpectErrors(
  options: Deno.CommandOptions,
) {
  const { serverProcess, address } = await spawnServer(options, true);

  if (address) {
    throw Error("Server started correctly");
  }

  const errorDecoder = new TextDecoderStream();
  const errorLines: ReadableStream<string> = serverProcess.stderr
    .pipeThrough(errorDecoder)
    .pipeThrough(new TextLineStream(), {
      preventCancel: true,
    });
  let output = "";
  for await (const line of errorLines) {
    output += line + "\n";
  }
  return output;
}

/**
 * Click on an element once it has an attached click listener
 */
export async function clickWhenListenerReady(page: Page, selector: string) {
  await page.waitForSelector(selector);
  await page.waitForFunction(
    (sel) => {
      const el = document.querySelector(sel)!;

      // Wait for Preact to have attached either a captured or non-captured
      // click event
      // deno-lint-ignore no-explicit-any
      const preactListener = (el as any).l as Record<string, unknown> | null;
      if (
        !preactListener || typeof preactListener !== "object" ||
        (!preactListener.clickfalse && !preactListener.clicktrue)
      ) {
        return false;
      }

      return true;
    },
    {},
    selector,
  );
  await page.click(selector);
}

export async function waitForText(
  page: Page,
  selector: string,
  text: string,
) {
  await page.waitForSelector(selector);
  await page.waitForFunction(
    (sel, value) => {
      return document.querySelector(sel)!.textContent === value;
    },
    { timeout: 2000 },
    selector,
    String(text),
  );
}

async function spawnServer(
  options: Deno.CommandOptions,
  expectErrors = false,
) {
  const serverProcess = new Deno.Command(Deno.execPath(), {
    ...options,
    stdin: "null",
    stdout: "piped",
    stderr: expectErrors ? "piped" : "inherit",
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

  return { serverProcess, lines, address };
}
