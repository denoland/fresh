import { render } from "preact";
import {
  Handlers,
  MiddlewareHandler,
  MiddlewareHandlerContext,
  Plugin,
} from "../server.ts";
import { RouteModule } from "../src/server/types.ts";
import { PageProps } from "$fresh/server.ts";

async function handler(
  req: Request,
  ctx: MiddlewareHandlerContext<Record<string, unknown>>,
) {
  ctx.state.data = "myData";
  const resp = await ctx.next();

  resp.headers.set("server", "fresh server");
  return resp;
}

export default function routPlug(): Plugin {
  return {
    name: "test_plugin",
    middlewares: [
      {
        path: "/",
        handler,
      },
    ],
    routes: [
      {
        path: "/[test]",
        component: Home,
        handler: {
          GET(req, ctx) {
            return ctx.render();
          },
        },
      },
    ],
  };
}

function Home(props: PageProps) {
  const { test } = props.params;

  console.log("hi handler", test);
  return (
    <div>
      <p>
        Welcome to Fresh. Try to update this message in the ./routes/index.tsx
        file, and refresh.666666
      </p>
    </div>
  );
}
