import { launch } from "@astral/astral";
import { Image } from "imagescript";

if (Deno.args.length !== 2) {
  throw new Error("Usage: screenshot <url> <id>");
}

const [url, id] = Deno.args;
const parsedUrl = new URL(url);
if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
  throw new Error("Invalid URL");
}

const browser = await launch();
const page = await browser.newPage(url);
await page.waitForNetworkIdle();
const raw = await page.screenshot();

await browser.close();

// convert to jpeg
const image2x = await Image.decode(raw);
await Deno.writeFile(
  `./www/static/showcase/${id}2x.jpg`,
  await image2x.encodeJPEG(80),
);

const image1x = image2x.resize(image2x.width / 2, Image.RESIZE_AUTO);
await Deno.writeFile(
  `./www/static/showcase/${id}1x.jpg`,
  await image1x.encodeJPEG(80),
);
