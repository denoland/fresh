const twindRegex = /export default\s*{([\s\S]*?)}\s*as Options/;

export default async function generateTailwindConfigFromTwindConfig(
  twindConfigPath: string,
  tailwindConfigPath: string,
): Promise<void> {
  const twindConfigText = await Deno.readTextFile(twindConfigPath).catch(
    (e) => {
      return Promise.reject(`Failed to read twind config file: ${e.message}`);
    },
  );
  const twindConfigMatch = twindConfigText.match(twindRegex);
  if (twindConfigMatch === null) {
    return Promise.reject(
      `Failed to parse twind config file: ${twindConfigPath}`,
    );
  }
  const twindConfig = twindConfigMatch[1].replace(
    /\s+selfURL:\s*import\.meta\.url,\n/,
    "",
  );
  const tailwindConfigText = `module.exports = {\n${twindConfig}}`;
  await Deno.writeTextFile(tailwindConfigPath, tailwindConfigText).catch(
    (e) => {
      return Promise.reject(
        `Failed to write tailwind config file: ${e.message}`,
      );
    },
  );
  return Promise.resolve();
}
