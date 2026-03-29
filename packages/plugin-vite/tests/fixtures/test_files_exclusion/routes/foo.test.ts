// This test file should NOT be bundled into production
export const handler = () => {
  return new Response("This should never be in production");
};
