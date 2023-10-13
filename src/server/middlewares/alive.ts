import { BUILD_ID } from "$fresh/src/server/build_id.ts";
import { ALIVE_URL } from "$fresh/src/server/constants.ts";

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

export const refreshJsMiddleware = () => {
  return new Response(refreshJs, {
    headers: {
      "content-type": "application/javascript; charset=utf-8",
    },
  });
};

export const aliveMiddleware = () => {
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
