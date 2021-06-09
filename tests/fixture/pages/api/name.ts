export default () => {
  return new Response(JSON.stringify({ name: "fresh" }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};

export function GET() {
  return new Response("Get fresh!", {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
