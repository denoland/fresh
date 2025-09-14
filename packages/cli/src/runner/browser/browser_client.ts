import { ModuleRunner } from "../module_runner.ts";
import { WsClient } from "../websocket/ws_client.ts";

export function browserClient(address: string) {
  const conn = new WsClient(address);
  const _runner = new ModuleRunner(conn);
}
