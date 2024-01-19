import { RouteConfig } from "$fresh/server.ts";
import { Handlers } from "$fresh/server.ts";
import { format, parse } from "$std/semver/mod.ts";
import VERSIONS from "../../versions.json" with { type: "json" };
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

export const handler: Handlers = {
  async GET(req, ctx) {
    const accept = req.headers.get("Accept");
    const isHTML = accept?.includes("text/html");
    const { version, path } = ctx.params;

    const semver = parse(version);
    if (!semver) {
      return new Response("Invalid version", { status: 400 });
    }

    if (!VERSIONS.includes(format(semver))) {
      return new Response("Version not found", { status: 404 });
    }

    const url = `${BASE_URL}${format(semver)}/${path}`;
    const r = await fetch(url, { redirect: "manual" });
    const response = new Response(r.body, r);
    response.headers.delete("content-encoding");

    if (response.status === 404) {
      return new Response(
        "404: Not Found. The requested Fresh release or file do not exist.",
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
