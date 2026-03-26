import { launch } from "@astral/astral";
import { Image } from "imagescript";

export function validateArgs(args: string[]): [string, string] {
  if (args.length !== 2) {
    throw new Error("Usage: screenshot <url> <id>");
  }
  return [args[0], args[1]];
}

export function validateUrl(url: string): URL {
  const parsedUrl = new URL(url);
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    throw new Error("Invalid URL");
  }
  return parsedUrl;
}

export function generateFilePaths(
  id: string,
): { image2x: string; image1x: string } {
  return {
    image2x: `./www/static/showcase/${id}2x.jpg`,
    image1x: `./www/static/showcase/${id}1x.jpg`,
  };
}

export async function captureScreenshot(
  url: string,
  id: string,
): Promise<void> {
  const browser = await launch();
  try {
    const page = await browser.newPage(url);
    await page.waitForNetworkIdle();
    const raw = await page.screenshot();

    const image2x = await Image.decode(raw);
    const { image2x: path2x, image1x: path1x } = generateFilePaths(id);

    await Deno.writeFile(path2x, await image2x.encodeJPEG(80));
    const image1x = image2x.resize(image2x.width / 2, Image.RESIZE_AUTO);
    await Deno.writeFile(path1x, await image1x.encodeJPEG(80));
  } finally {
    await browser.close();
  }
}

// only run the script if it's the main module
if (import.meta.main) {
  const [url, id] = validateArgs(Deno.args);
  validateUrl(url);
  await captureScreenshot(url, id);
  // deno-lint-ignore no-console
  console.log(`Screenshot saved as ${id}1x.jpg and ${id}2x.jpg`);
}
