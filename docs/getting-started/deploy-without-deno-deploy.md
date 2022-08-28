---
description: |
  Deploy a fresh application without Deno Deploy to any number of on or off premise docker hosting providers.
---

As an alternate final step in the getting started guide, we'll deploy the demo
site to the public internet using [Deno's Docker Image][deno-docker]. Docker is
a tool to containerize projects and allow them to run on any platform where it
is supported.

Create and name a file `Dockerfile`. Fill it with the content below.

```
FROM denoland/deno:latest

EXPOSE 8000

# Set this variable to any value to tell fresh it is running in production (https://github.com/denoland/fresh/issues/535)
ENV DENO_DEPLOYMENT_ID true

WORKDIR /app

USER deno

COPY . .

RUN deno cache main.ts --import-map=import_map.json

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "main.ts"]
```

Now to test your app run the following. After running these commands, open up
`http://localhost` and your app should be running successfully.

```
docker build -t fresh-app . # Build the app with docker
docker images --filter reference=fresh-app # Check to make sure the app was properly built
docker run -t -i -p 80:8000 fresh-app # Run the app on port 80
```

To deploy to a cloud provider, push it to a container registry and follow their
documentation.

- [Amazon Web Services][aws-container-registry]
- [Google Cloud][gcp-container-registry]

[deno-docker]: https://hub.docker.com/r/denoland/deno
[aws-container-registry]: https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-container-image.html#create-container-image-push-ecr
[gcp-container-registry]: https://cloud.google.com/container-registry/docs/pushing-and-pulling
