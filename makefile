fmt:
	deno fmt

lint:
	deno lint

test:
	deno test -A --no-check=remote

dev:
	deno run -A --watch=www/static,src/ --no-check www/main.ts