const encoder = new TextEncoder();

export function getEtag(filePath: string): Promise<string> {
  // TODO: Include file content in hashing
  return crypto.subtle.digest(
    "SHA-1",
    encoder.encode(filePath),
  ).then((hash) =>
    Array.from(new Uint8Array(hash))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}
