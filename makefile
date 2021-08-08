fmt:
	deno fmt

lint:
	deno lint

test:
	deno test --no-check -A

watch_example:
	deno run -A --unstable --watch example/main.ts