import { assertEquals } from "https://deno.land/std@0.190.0/testing/asserts.ts";
import { routeWarnings } from "../src/server/context.ts";
import { Route } from "../src/server/types.ts";

// Deno.test({
//   name: "route-conflicts",
//   async fn() {
//     const controller = new AbortController();
//     const { signal } = controller;
//     const cliProcess = new Deno.Command(Deno.execPath(), {
//       args: [
//         "run",
//         "-A",
//         `tests/fixture_dynamic_route_warning/dev.ts`,
//       ],
//       stdin: "null",
//       stdout: "piped",
//       stderr: "piped",
//       signal,
//     });

//     const { stdout } = await cliProcess.output();
//     const stdoutDecoded = new TextDecoder().decode(stdout);
//     assertStringIncludes(
//       stdoutDecoded,
//       `Potential route conflict: The dynamic route '/one_dynamic/:dynamic' will sort below the following static routes:
//       /one_dynamic/normal_route

//     Potential route conflict: The dynamic route '/override/:path*' will sort below the following static routes:
//       /override/normal_route`,
//     );
//   },
// });

Deno.test({
  name: "route conflicts unit",
  fn() {
    const routes = [
      { name: "control-index", pattern: "/control" },
      { name: "control-normal_route", pattern: "/control/normal_route" },
      {
        name: "one_dynamic-normal_route",
        pattern: "/one_dynamic/normal_route",
      },
      { name: "one_dynamic-[dynamic]", pattern: "/one_dynamic/:dynamic" },
      { name: "override-normal_route", pattern: "/override/normal_route" },
      { name: "override-override", pattern: "/override/:path*" },
    ] as Route[];
    const expected = [
      `Potential route conflict: The dynamic route '/one_dynamic/:dynamic' will sort below the following static routes:\n  /one_dynamic/normal_route\n`,
      `Potential route conflict: The dynamic route '/override/:path*' will sort below the following static routes:\n  /override/normal_route\n`,
    ];
    const output = routeWarnings(routes);
    assertEquals(output, expected);
  },
});
