// deno-lint-ignore-file no-process-global

const ADAPTERS = [
  {
    test: () =>
      typeof Deno !== "undefined" ||
      typeof process !== "undefined" &&
        typeof process.versions?.deno === "string",
    init: () => import("./deno-adapter.ts"),
  },
];

export async function autoAdapter() {
  for (const adapter of ADAPTERS) {
    if (adapter.test()) {
      const mod = await adapter.init();
      return mod.default;
    }
  }
}
