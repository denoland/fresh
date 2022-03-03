export const handler = {
  GET() {
    return new Response("Get fresh!", {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  },
  NOTAMETHOD() {
    throw new Error("unreachable");
  },
};
