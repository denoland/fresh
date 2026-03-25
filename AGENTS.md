# Agents

## Git Workflow

- To check out a PR branch, use `gh pr checkout <pr-number>`. Do not set up
  remotes manually.
- Always run `deno fmt` before pushing.
- Do not commit `deno.lock` changes unless the PR is specifically about updating
  dependencies. Lockfile diffs tend to be noisy and environment-specific.

## Development

- Run `deno task ok` before pushing — it runs the full local CI check (fmt,
  lint, type check, tests).
- The lockfile contains remote specifiers pointing to `refs/heads/main` (e.g.
  `raw.githubusercontent.com/.../refs/heads/main/...`). These hashes go stale
  when upstream pushes. When that happens, manually update the hash in
  `deno.lock` since `deno cache --reload` cannot fix it
  (see https://github.com/denoland/deno/issues/32991).
