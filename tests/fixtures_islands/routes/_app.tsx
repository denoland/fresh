import { define } from "../utils.ts";

export default define.page(function App(props) {
  return (
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Test</title>
      </head>
      <body>
        <props.Component />
      </body>
    </html>
  );
});
