import { RouteConfig } from "$fresh/server.ts";
import { Handlers } from "$fresh/server.ts";
import { parse } from "$std/semver/mod.ts";
import VERSIONS from "../../versions.json" assert { type: "json" };

const BASE_URL = "https://raw.githubusercontent.com/denoland/fresh/";

export const handler: Handlers = {
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

    if (isHTML) {
      response.headers.set("Content-Type", "text/plain");
    } else if (path.endsWith(".ts")) {
      response.headers.set("Content-Type", "application/typescript");
    } else if (path.endsWith(".js")) {
      response.headers.set("Content-Type", "application/javascript");
    } else if (path.endsWith(".tsx")) {
      response.headers.set("Content-Type", "text/tsx");
    } else if (path.endsWith(".jsx")) {
      response.headers.set("Content-Type", "text/jsx");
    } else if (path.endsWith(".json")) {
      response.headers.set("Content-Type", "application/json");
    } else if (path.endsWith(".wasm")) {
      response.headers.set("Content-Type", "application/wasm");
    } else {
      response.headers.set("Content-Type", "text/plain");
    }
    return response;
  },
};

export const config: RouteConfig = {
  routeOverride: "/@:version/:path*",
};
