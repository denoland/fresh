import puppeteer from "npm:puppeteer@24.7.2";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";

if (Deno.args.length !== 2) {
  throw new Error("Usage: screenshot <url> <id>");
}

const [url, id] = Deno.args;
const parsedUrl = new URL(url);
if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
  throw new Error("Invalid URL");
}

const browser = await puppeteer.launch({
  defaultViewport: { width: 1200, height: 675 },
  headless: true,
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle2" });
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
