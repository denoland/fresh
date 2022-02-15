export const publicFetcher = (_key: string) => {
  const _apiKey = "public_key";
  return new Promise<string>((resolve) => {
    setTimeout(() => resolve("Hello!"), 100);
  });
};
