import { compose, ComposeHandler } from "./compose.ts";
import { InternalFreshConfig, StaticFile } from "./types.ts";
import {
  ALIVE_URL,
  JS_PREFIX,
  REFRESH_JS_URL,
} from "$fresh/src/server/constants.ts";
import { BUILD_ID } from "$fresh/src/server/build_id.ts";
import { MethodRouter } from "$fresh/src/server/compose_router.ts";
import { INTERNAL_PREFIX } from "$fresh/src/runtime/utils.ts";
import { staticFileMiddleware } from "$fresh/src/server/static_files.ts";
import { extname, Status, typeByExtension } from "$fresh/src/server/deps.ts";
import { BuildSnapshot } from "$fresh/src/build/mod.ts";
import {
  FromManifestConfig,
  getServerContext,
} from "$fresh/src/server/context.ts";
import { getFreshConfigWithDefaults } from "$fresh/src/server/config.ts";
import { Manifest } from "$fresh/src/server/mod.ts";

// deno-lint-ignore no-explicit-any
export class App<S = any> {
  #handlers: ComposeHandler<S>[] = [];

  use(handler: ComposeHandler<S>) {
    this.#handlers.push(handler);
    return this;
  }

  handler() {
    return compose(this.#handlers);
  }
}

const refreshJs = `let es = new EventSource("${ALIVE_URL}");
window.addEventListener("beforeunload", (event) => {
  es.close();
});
es.addEventListener("message", function listener(e) {
  if (e.data !== "${BUILD_ID}") {
    this.removeEventListener("message", listener);
    location.reload();
  }
});`;

const refreshJsMiddleware = () => {
  return new Response(refreshJs, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
    },
  });
};

const aliveMiddleware = () => {
  let timerId: number | undefined = undefined;

  const body = new ReadableStream({
    start(controller) {
      controller.enqueue(`data: ${BUILD_ID}\nretry: 100\n\n`);
      timerId = setInterval(() => {
        controller.enqueue(`data: ${BUILD_ID}\n\n`);
      }, 1000);
    },
    cancel() {
      if (timerId !== undefined) {
        clearInterval(timerId);
      }
    },
  });

  return new Response(body.pipeThrough(new TextEncoderStream()), {
    headers: {
      "content-type": "text/event-stream",
    },
  });
};

function trailingSlashMiddleware(
  trailingSlashEnabled: boolean,
): ComposeHandler {
  return (req, ctx) => {
    // Redirect requests that end with a trailing slash to their non-trailing
    // slash counterpart.
    // Ex: /about/ -> /about
    const url = new URL(req.url);
    if (
      url.pathname.length > 1 && url.pathname.endsWith("/") &&
      !trailingSlashEnabled
    ) {
      // Remove trailing slashes
      const path = url.pathname.replace(/\/+$/, "");
      const location = `${path}${url.search}`;
      return new Response(null, {
        status: Status.TemporaryRedirect,
        headers: { location },
      });
    } else if (trailingSlashEnabled && !url.pathname.endsWith("/")) {
      // If the last element of the path has a "." it's a file
      const isFile = url.pathname.split("/").at(-1)?.includes(".");

      // If the path uses the internal prefix, don't redirect it
      const isInternal = url.pathname.startsWith(INTERNAL_PREFIX);

      if (!isFile && !isInternal) {
        url.pathname += "/";
        return Response.redirect(url, Status.PermanentRedirect);
      }
    }

    return ctx.next();
  };
}

function assetMiddleware(
  getSnapshot: () => Promise<BuildSnapshot>,
): ComposeHandler {
  return async (_req, ctx) => {
    const { params } = ctx;
    const snapshot = await getSnapshot();
    const contents = await snapshot.read(params.path);
    if (!contents) return new Response(null, { status: 404 });

    const headers: Record<string, string> = {
      "Cache-Control": "public, max-age=604800, immutable",
    };

    const contentType = typeByExtension(extname(params.path));
    if (contentType) headers["Content-Type"] = contentType;

    return new Response(contents, {
      status: 200,
      headers,
    });
  };
}

export async function createFreshApp(
  config: FromManifestConfig,
  manifest?: Manifest,
) {
  const internalConfig = await getFreshConfigWithDefaults(
    config,
    // TODO: Root
    manifest === undefined ? Deno.cwd() : manifest.baseUrl,
    manifest,
  );
  const serverContext = await getServerContext(internalConfig);

  const router = new MethodRouter()
    .use(trailingSlashMiddleware(internalConfig.router.trailingSlash))
    // Bundled assets
    .all(
      `${INTERNAL_PREFIX}${JS_PREFIX}/${BUILD_ID}/:path*`,
      assetMiddleware(() => serverContext.buildSnapshot()),
    );

  // Development specific routes
  if (internalConfig.dev) {
    router
      .all(REFRESH_JS_URL, refreshJsMiddleware)
      .all(ALIVE_URL, aliveMiddleware);
  }

  const appRouter = new MethodRouter();

  router.all(
    "*",
    compose([
      // Static asset routes which falls through to next middleware
      // if none match
      staticFileMiddleware(internalConfig.staticDir),

      // App routes
      appRouter.handler(),
      // TODO: Make 404 route optional
    ]),
  );

  return router;
}
