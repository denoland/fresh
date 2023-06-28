import { RouteConfig } from "$fresh/server.ts";
import { MultiHandler } from "$fresh/server.ts";
import { parse } from "$std/semver/mod.ts";
import VERSIONS from "../../versions.json" assert { type: "json" };
import { extname } from "$std/path/mod.ts";

const BASE_URL = "https://raw.githubusercontent.com/denoland/fresh/";

const contentTypes = new Map([
  [".html", "text/plain"],
  [".ts", "application/typescript"],
  [".js", "application/javascript"],
  [".tsx", "text/tsx"],
  [".jsx", "text/jsx"],
  [".json", "application/json"],
  [".wasm", "application/wasm"],
]);

export const handler: MultiHandler = {
  async GET(req, ctx) {
    const accept = req.headers.get("Accept");
    const isHTML = accept?.includes("text/html");
    const { version, path } = ctx.params;

    const semver = parse(version, { includePrerelease: true });
    if (!semver) {
      return new Response("Invalid version", { status: 400 });
    }

    if (!VERSIONS.includes(semver.version)) {
      return new Response("Version not found", { status: 404 });
    }

    const url = `${BASE_URL}${semver.version}/${path}`;
    const r = await fetch(url, { redirect: "manual" });
    const response = new Response(r.body, r);
    response.headers.delete("content-encoding");

    if (response.status === 404) {
      return new Response(
        "404: Not Found. The requested fresh release or file do not exist.",
        { status: 404 },
      );
    }

    if (!response.ok) {
      response.headers.set("Content-Type", "text/plain");
      return response;
    }

    const value = isHTML
      ? "text/plain"
      : contentTypes.get(extname(path)) ?? "text/plain";
    response.headers.set("Content-Type", value);

    return response;
  },
};

export const config: RouteConfig = {
  routeOverride: "/@:version/:path*",
};
