export const handler = () => {
  const json = {
    MY_ENV: Deno.env.get("MY_ENV"),
    VITE_MY_ENV: Deno.env.get("VITE_MY_ENV"),
    MY_LOCAL_ENV: Deno.env.get("MY_LOCAL_ENV"),
    VITE_MY_LOCAL_ENV: Deno.env.get("VITE_MY_LOCAL_ENV"),
  };

  return Response.json(json);
};
