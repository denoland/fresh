import {
  createServer as createViteServer,
  type RunnableDevEnvironment,
} from "vite";

async function createServer() {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
    },
    appType: "custom",
    environments: {
      server: {},
    },
  });

  const ssr = vite.environments.ssr as RunnableDevEnvironment;

  return async (req: Request): Promise<Response> => {
    // console.log(ssr);
    const mod = await ssr.runner.import("server-entry");
    console.log(mod);
    return new Response("ok");
  };
}

const handler = await createServer();

Deno.serve(handler);
