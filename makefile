fmt:
	deno fmt

lint:
	deno lint

test:
	deno test -A --no-check=remote

dev:
	deno run -A --watch=www/static,src/,docs/ --no-check www/main.ts