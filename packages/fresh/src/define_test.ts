import { expect } from "@std/expect";
import { createDefine } from "./define.ts";
import { page } from "./handlers.ts";

Deno.test.ignore("createDefine", () => {
  const define = createDefine<{ foo: number }>();

  // Testing the types
  const handlerFn = define.handlers((ctx) => {
    ctx.state.foo satisfies number;
    return page({ bar: true });
  });
  const handlerObj = define.handlers({
    GET(ctx) {
      ctx.state.foo satisfies number;
      return page({ bar: [1, 2, 3] });
    },
    POST: () => {
      return page({ baz: "hello" });
    },
  });

  define.page<typeof handlerFn>(({ data }) => {
    data.bar satisfies boolean;
    return "page";
  });

  define.page<typeof handlerObj>(({ data }) => {
    if ("baz" in data) {
      data.baz satisfies string;
    } else {
      data.bar satisfies number[];
    }
    return "page";
  });

  define.middleware((ctx) => {
    ctx.state.foo satisfies number;
    return new Response("Hello");
  });

  expect(typeof define.page).toBe("function");
  expect(typeof define.handlers).toBe("function");
  expect(typeof define.middleware).toBe("function");
});
