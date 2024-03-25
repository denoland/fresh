import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { Image } from "https://deno.land/x/imagescript@1.2.17/mod.ts";
import { join } from "https://deno.land/std@0.216.0/path/mod.ts";

const url = Deno.args[0];
const id = Deno.args[1];

if (Deno.args.length == 0) {
  console.log("Usage: screenshot <url> <id>");
  Deno.exit(0);
}

if (!(url.match(/^http[s]?:\/\//)) || !url) {
  console.log("Provided URL is Broken or Wrong");
  Deno.exit(0);
}

if (!id) {
  console.log("Provide id to Process");
  Deno.exit(0);
}

const outDir = "./www/static/showcase";
const browser = await puppeteer.launch({
  defaultViewport: { width: 1200, height: 675 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle2" });
const raw = await page.screenshot();

await browser.close();

if (!(raw instanceof Uint8Array)) {
  console.log("Invalid Image");
  Deno.exit(0);
}
// convert to jpeg
const image2x = await Image.decode(raw);
const jpeg2x = join(outDir, `${id}2x.jpg`);
await Deno.writeFile(jpeg2x, await image2x.encodeJPEG(80));

const jpeg1x = join(outDir, `${id}1x.jpg`);
const image1x = image2x.resize(image2x.width / 2, Image.RESIZE_AUTO);
await Deno.writeFile(jpeg1x, await image1x.encodeJPEG(80));
