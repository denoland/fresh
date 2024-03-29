import type { RouteConfig } from "../../../src/__OLD/server/types.ts";

export const config: RouteConfig = {
  skipAppWrapper: true,
  skipInheritedLayouts: true,
};

export default function App() {
  return (
    <html>
      <head>
        <style>{`body { color: red }`}</style>
      </head>
      <body>
        hello
      </body>
    </html>
  );
}
