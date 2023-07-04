export const deprecate = (
  // deno-lint-ignore no-explicit-any
  toDeprecate: any,
  oldName: string,
  newName: string,
) => {
  console.warn(
    `⚠️  "${oldName}" has been deprecated, it will be removed in the future. Please replace it with "${newName}".`,
  );
  console.trace();
  return toDeprecate;
};
