import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";
import { Image } from "https://deno.land/x/imagescript@v1.2.14/mod.ts";
import { join } from "https://deno.land/std@0.137.0/path/mod.ts";

const url = Deno.args[0];
const id = Deno.args[1];

if (!url || !id) {
  console.log("Usage: screenshot <url> <id>");
  Deno.exit(1);
}

const outDir = "./www/static/showcase";
const browser = await puppeteer.launch({
  defaultViewport: { width: 1200, height: 675 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle2" });
const png2x = join(outDir, `${id}.png`);
await page.screenshot({ path: png2x });

await browser.close();

// convert to jpeg
const image2x = await Image.decode(await Deno.readFile(png2x));
const jpeg2x = join(outDir, `${id}2x.jpg`);
await Deno.writeFile(jpeg2x, await image2x.encodeJPEG(80));

const jpeg1x = join(outDir, `${id}1x.jpg`);
const image1x = image2x.resize(image2x.width / 2, Image.RESIZE_AUTO);
await Deno.writeFile(jpeg1x, await image1x.encodeJPEG(80));

await Deno.removeSync(png2x);
