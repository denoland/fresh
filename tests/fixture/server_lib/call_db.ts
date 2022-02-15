function callDB(): Promise<string> {
  const _privateApiKey = 'super_secret_key'
  return new Promise((resolve) => {
    setTimeout(() => resolve('called db with secret'), 5)
  })
}

export async function fetcher(_url: string): Promise<string | null> {
  const resp = await callDB();
  return resp;
}