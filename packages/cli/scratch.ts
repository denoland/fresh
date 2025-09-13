export interface PluginCtx {
  mode: "development" | "production";
  config: ResolvedConfig;
  resolve(filter: any, fn: any): void;
  load(filter: any, fn: any): void;
  transform(filter: any, fn: any): void;
  configureServer(filter: any, fn: any): void;
}

export function plugin(
  name: string,
  fn: (ctx: PluginCtx) => void | Promise<void>,
) {
}

const plugins = [
  {
    name: "foo",
    resolveId(id) {
      return "foo";
    },
    load(id) {
      return "foo";
    },
  },
  {
    name: "foo",
    resolveId: {
      filter: {
        id: "foo",
      },
      handler(id) {
        return "foo";
      },
    },
    load: {
      filter: {
        id: "foo",
      },
      handler(id) {
        return "foo";
      },
    },
  },
  plugin("foo", (ctx) => {
    ctx.resolve({ id: "foo" }, (args) => {
      return "foo";
    });
    ctx.load({ id: "foo" }, (args) => {
      return "foo";
    });
  }),
  {
    name: "foo",
    config() {
      return {};
    },
    setup(ctx) {
      ctx.onResolve({ id: "foo" }, (args) => {
        return "foo";
      });
      ctx.onLoad({ id: "foo" }, (args) => {
        return "foo";
      });
    },
  },
  function foo(ctx) {
    ctx.onResolve({ id: "foo" }, (args) => {
      return "foo";
    });
    ctx.onLoad({ id: "foo" }, (args) => {
      return "foo";
    });
  },
];
