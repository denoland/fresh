import type { IncomingMessage, ServerResponse } from "node:http";

export function nodeToRequest(node: IncomingMessage, url: URL): Request {
  const controller = new AbortController();
  node.once("aborted", () => controller.abort());

  let body = undefined;

  if (
    node.method !== "HEAD" && node.method !== "GET" && node.method !== "OPTIONS"
  ) {
    // FIXME
  }

  return new Request(url, {
    headers: node.headers as Record<string, string>,
    method: node.method,
    body,
    signal: controller.signal,
  });
}

export async function responseToNode(
  res: Response,
  node: ServerResponse<IncomingMessage>,
): Promise<void> {
  res.headers.forEach((value, key) => {
    node.setHeader(key, value);
  });

  node.writeHead(res.status);

  if (res.body === null) {
    node.end();
    return;
  }

  if (res.body.locked) {
    node.end(`Error: Response body is locked.`);
    return;
  }

  const reader = res.body.getReader();

  if (node.destroyed) {
    await reader.cancel();
    return;
  }

  const cancel = (error: unknown) => {
    node.off("close", cancel);
    node.off("error", cancel);

    // Can't respond anymore with error
    reader.cancel(error).catch(() => {});

    if (error) {
      node.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  };

  node.on("close", cancel);
  node.on("error", cancel);

  async function next() {
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (!node.write(value)) {
          node.once("drain", next);
          return;
        }
      }

      node.end();
    } catch (error) {
      cancel(error);
    }
  }

  next();
}
