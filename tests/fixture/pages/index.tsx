/** @jsx h */

import { publicFetcher } from "../client_lib/unsecureFetcher.ts";
import { h, IS_BROWSER, PageConfig, useData } from "../deps.ts";
import { fetcher } from "../server_lib/call_db.ts";

export default function Home() {
  const message = useData("home", publicFetcher);
  const message2 = useData("home2", fetcher);
  return (
    <div>
      <p>{message}</p>
      <p>{message2}</p>
      <p>{IS_BROWSER ? "Viewing browser render." : "Viewing JIT render."}</p>
    </div>
  );
}

export const config: PageConfig = { runtimeJS: true };
