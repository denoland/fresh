import { FreshApp } from "./app.ts";

Deno.test("defineMiddleware type", () => {
  const app = new FreshApp<{ text: string }>();

  // This should not give type errors
  app.defineMiddleware((ctx) => {
    return new Response(ctx.state.text);
  });
});

Deno.test("defineHandlers type", () => {
  const app = new FreshApp<{ text: string }>();

  // These should not give type errors
  app.defineHandlers((ctx) => {
    return new Response(ctx.state.text);
  });

  app.defineHandlers({
    GET(ctx) {
      return new Response(ctx.state.text);
    },
  });
});

Deno.test("definePage type", () => {
  const app = new FreshApp<{ text: string }>();

  // These should not give type errors
  const handlers = app.defineHandlers({
    GET(ctx) {
      return {
        data: { foo: ctx.state.text },
      };
    },
  });

  app.definePage<typeof handlers>((props) => {
    props.state.text;
    props.data.foo;

    return null;
  });
});
