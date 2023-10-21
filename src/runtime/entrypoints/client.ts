import { isWsRevision } from "../../dev/ws_connection.ts";

let ws: WebSocket;

// Keep track of the current revision
let revision = 0;

function logMessage(msg: string) {
  console.log(
    `%c 🍋 Fresh %c ${msg}`,
    "background-color: #86efac; color: black",
    "color: inherit",
  );
}

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
      logMessage("Connection closed. Trying to reconnect...");
    }
    backoffIdx++;

    try {
      connect();
      clearTimeout(reconnectTimer);
    } catch (_err) {
      reconnect();
    }
  }, backoff[Math.min(backoffIdx, backoff.length - 1)]);
}

function connect() {
  const url = new URL("/_frsh/alive", location.origin.replace("http", "ws"));
  ws = new WebSocket(
    url,
  );

  ws.addEventListener("open", () => {
    backoffIdx = 0;
    logMessage("Connected to development server.");
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
  if (isWsRevision(data)) {
    if (revision === 0) {
      revision = data.value;
    } else {
      location.reload();
    }
  }
}

function handleError(e: Event) {
  // TODO
  // deno-lint-ignore no-explicit-any
  if (e && (e as any).code === "ECONNREFUSED") {
    setTimeout(connect, 1000);
  }
}
