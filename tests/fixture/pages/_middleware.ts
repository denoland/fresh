export async function handler(_req: Request, handle: () => Promise<Response>) {
  const resp = await handle();
  resp.headers.set("server", "fresh test server");
  return resp;
}
