fmt:
	deno fmt

lint:
	deno lint

test:
	deno test -A

dev:
	deno run -A --watch --no-check www/main.ts