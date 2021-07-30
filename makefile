fmt:
	deno fmt

lint:
	deno lint

test:
	deno test --no-check -A --config tsconfig.json

watch_example:
	deno run -A --unstable --config example/tsconfig.json --watch example/main.ts