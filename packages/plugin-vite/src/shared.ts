export function hashCode(moduleId: string) {
  let hash = 0,
    i,
    chr;
  if (moduleId.length === 0) return hash;
  for (i = 0; i < moduleId.length; i++) {
    chr = moduleId.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}
