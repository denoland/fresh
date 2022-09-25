import { Handler } from "../../../server.ts";

export const handler: Handler = () => {
  throw new Response("<html><body>Intercepted</body></html>", {
    status: 200,
    headers: {
      "Content-Type": "text/html",
    },
  });
};

export default function Page() {
  return <p>Not Intercepted</p>;
}
