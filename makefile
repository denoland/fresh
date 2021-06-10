fmt:
	deno fmt

lint:
	deno lint

test:
	deno test --no-check -A --config tsconfig.json

watch_example:
	deployctl run --watch --no-check example/main.ts