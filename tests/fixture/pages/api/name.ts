export default () => {
  return new Response(JSON.stringify({ name: "fresh" }), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
