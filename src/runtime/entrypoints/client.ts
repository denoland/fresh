let ws: WebSocket;

let reconnectTimer: number;
const backoff = [
  // Wait 100ms initially, because we could also be
  // disconnected because of a form submit.
  100,
  150,
  200,
  250,
  300,
  350,
  400,
  450,
  500,
  500,
  605,
  750,
  1000,
  1250,
  1500,
  1750,
  2000,
];
let backoffIdx = 0;
function reconnect() {
  if (ws.readyState !== ws.CLOSED) return;

  reconnectTimer = setTimeout(() => {
    if (backoffIdx === 0) {
      console.log(
        `%c Fresh %c Connection closed. Trying to reconnect...`,
        "background-color: #86efac; color: black",
        "color: inherit",
      );
    }
    backoffIdx++;

    try {
      connect(true);
      clearTimeout(reconnectTimer);
    } catch (_err) {
      reconnect();
    }
  }, backoff[Math.min(backoffIdx, backoff.length - 1)]);
}

function connect(forceReload?: boolean) {
  const url = new URL("/_frsh/alive", location.origin.replace("http", "ws"));
  ws = new WebSocket(
    url,
  );

  addEventListener("unload", () => {
    // Prevent form submits from triggering a reconnect
    clearTimeout(reconnectTimer);
  });

  ws.addEventListener("open", () => {
    if (forceReload) {
      location.reload();
    } else {
      backoffIdx = 0;
      console.log(
        `%c Fresh %c Connected to development server.`,
        "background-color: #86efac; color: black",
        "color: inherit",
      );
    }
  });

  ws.addEventListener("close", () => {
    reconnect();
  });

  ws.addEventListener("message", handleMessage);
  ws.addEventListener("error", handleError);
}

connect();

function handleMessage(e: MessageEvent) {
  const data = JSON.parse(e.data);
  console.log(data);
}

function handleError(e: Event) {
  // TODO
  // deno-lint-ignore no-explicit-any
  if (e && (e as any).code === "ECONNREFUSED") {
    setTimeout(connect, 1000);
  }
}
