---
description: |
  Deploy Fresh via Docker yourself.
---

You can deploy Fresh to any platform that can run Docker containers. Docker is a
tool to containerize projects and portably run them on any supported platform.

## Creating a Docker image

When packaging your Fresh app for Docker, it is important that you set the
`DENO_DEPLOYMENT_ID` environment variable in your container. This variable needs
to be set to an opaque string ID that represents the version of your application
that is currently being run. This could be a Git commit hash, or a hash of all
files in your project. It is critical for the function of Fresh that this ID
changes when _any_ file in your project changes - if it doesn't, incorrect
caching **will** cause your project to not function correctly.

Here is an example `Dockerfile` for a Fresh project:

```dockerfile Dockerfile
# Pick the latest deno version here
FROM denoland/deno:1.44.4

ARG GIT_REVISION
ENV DENO_DEPLOYMENT_ID=${GIT_REVISION}

WORKDIR /app

COPY . .
RUN deno cache main.ts

EXPOSE 8000

CMD ["run", "-A", "main.ts"]
```

To build your Docker image inside of a Git repository:

```sh Terminal
$ docker build --build-arg GIT_REVISION=$(git rev-parse HEAD) -t my-fresh-app .
```

Then run your Docker container:

```sh Terminal
$ docker run -t -i -p 80:8000 my-fresh-app
```

To deploy to a cloud provider, push it to a container registry and follow their
documentation.

- [Amazon Web Services](https://docs.aws.amazon.com/AmazonECS/latest/userguide/create-container-image.html#create-container-image-push-ecr)
- [Google Cloud](https://cloud.google.com/container-registry/docs/pushing-and-pulling)
