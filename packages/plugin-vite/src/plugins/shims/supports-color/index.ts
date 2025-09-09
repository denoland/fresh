export interface ColorSupport {
  level: 1 | 2 | 3;
  hasBasic: boolean;
  has256: boolean;
  has16m: boolean;
}

function toLevel(depth: number): 1 | 2 | 3 {
  if (depth === 1) return 1;
  if (depth === 8) return 2;
  if (depth === 24) return 3;
  return 1;
}

function toSupport(depth: number): ColorSupport {
  const level = toLevel(depth);
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3,
  };
}

export default {
  // deno-lint-ignore no-process-global
  stdout: toSupport(process.stdout.getColorDepth()),
  // deno-lint-ignore no-process-global
  stderr: toSupport(process.stderr.getColorDepth()),
};
