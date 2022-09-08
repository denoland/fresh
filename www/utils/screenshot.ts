import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const url = Deno.args[0];
const id = Deno.args[1];

if (!url || !id) {
  console.log("Usage: screenshot <url> <id>");
  Deno.exit(1);
}

const browser = await puppeteer.launch({
  defaultViewport: { width: 1200, height: 675 },
});
const page = await browser.newPage();
await page.goto(url, { waitUntil: "networkidle2" });
await page.evaluate("window.scroll(0, 100000)");
await page.screenshot({ path: `./www/static/showcase/${id}.png` });

await browser.close();
