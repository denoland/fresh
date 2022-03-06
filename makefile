fmt:
	deno fmt

lint:
	deno lint

test:
	deno test -A --no-check=remote
	deno cache --no-check=remote www/main.ts
	deno cache --no-check=remote examples/counter/main.ts

dev:
	deno run -A --watch=www/static,src/,docs/ --no-check www/main.ts