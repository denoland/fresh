export const handler = {
  HEAD() {
    return new Response(null, {
      status: 204,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  },
  GET() {
    return new Response("Get fresh!", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  },
};
