fmt:
	deno fmt

lint:
	deno lint

test:
	deno test -A

watch_example:
	deno run -A --unstable --watch --no-check example/main.ts