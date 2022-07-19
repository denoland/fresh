---
title: Build your own github using Deno Fresh and Github REST API
description : In this post we will build a simple github using fresh and github rest api.
slug: build-your-own-github-using-deno-fresh-and-github-rest-api-32h6
poster : https://res.cloudinary.com/practicaldev/image/fetch/s--E2dVmnIB--/c_imagga_scale,f_auto,fl_progressive,h_420,q_auto,w_1000/https://dev-to-uploads.s3.amazonaws.com/uploads/articles/lwrjlidkua2wn0ggd2l8.png

postedAt : 19 Jul, 2022
tags: 
  - javascript
  - deno
  - fresh
  - twind
  - github-rest-api
  - deno-deploy


authorName: Harsh Mangalam
authorAvatar: https://avatars.githubusercontent.com/u/57381638?v=4

github : harshmangalam/freshHub

---


Javascript ecosystem is expanding every day. Time to time javascript enthusiastic introduce new concept and new way to enhance the developer experience like Island architecture, Resumability, fine grained reactivity and much more..

In this blog post we will explore Fresh framework and will build a small github using github rest api.

Deno is a simple, modern and secure runtime for JavaScript, TypeScript, and WebAssembly that uses V8 and is built in Rust.

Preact is a javascript based frontend framework alternative to react with the same modern api like hooks,context,etc..


Fresh is a server render web framework build on top of deno , preact and Island architecture pattern.
A beautiful fact about Fresh is that it has no build so if you will deploy Fresh on Deno-Deploy it will take very less time to go live. 

In this project we will use twind which provide tailwind like api for design the ui.

Create project using Fresh and run locally

```
deno run -A -r https://fresh.deno.dev fresh-hub
cd fresh-hub
deno task start

```

Go inside `routes/index.tsx`

```tsx

/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import { PageProps, Handlers } from "$fresh/server.ts";
import { fetchUserInfo } from "../services/github.ts";
import Layout from "../components/Layout.tsx";

export const handler: Handlers = {
  async POST(req, ctx) {
    try {
      // get form data from request
      const formData = await req.formData();
      // extract username from form data
      const username = formData.get("username");
      // add validation
      if (!username || username.toString().trim().length === 0) {
        return ctx.render({ error: "Username should not be empty" });
      }

      // check if username exists
      const [status] = await fetchUserInfo(String(username));
      // handle different error status code
      if (status === 404) {
        return ctx.render({ error: "User not found" });
      }
      if (status === 403) {
        return ctx.render({
          error: "Exceeded github api limit try after an hour",
        });
      }

      // redirect to user profile screen
      return new Response(undefined, {
        headers: {
          location: `/${username}`,
        },
        status: 302,
      });
    } catch (error) {
      return ctx.render({ error: error.message });
    }
  },
};
export default function Home({ data }: PageProps) {
  return (
    <Layout title={"Home"}>
      <form
        method="post"
        className={tw`max-w-md  mx-auto bg-gray-800 p-4 rounded-xl shadow-md`}
      >
        <div className={tw`flex flex-col space-y-2`}>
          <label htmlFor="username">Github Username</label>
          <input
            autoFocus
            type="text"
            name="username"
            id="username"
            className={tw`bg-gray-700 px-4 py-2 rounded-md border-2 ${
              data?.error ? "border-red-400" : "border-blue-400"
            } focus:outline-none`}
            placeholder={"harshmangalam"}
          />
          {data?.error && (
            <p className={tw`text-sm text-red-400`}>{data.error}</p>
          )}
        </div>
        <button
          className={tw`focus:outline-none hover:bg-gray-600 bg-gray-700 text-lg font-bold w-full mt-4 py-2 px-4 rounded-md`}
        >
          Continue
        </button>
      </form>
    </Layout>
  );
}



```


Layout is a simple component that contain navbar and title of web page


when we will submit the form then handler POST method will run.

If you want to access form data invoke `req.formData()` method that will return `FormData`.

`fetchUserInfo` is a utility method that fetch data from github rest api. If you are unauthenticated user then you can only make 60 request per hour to github rest api.

`ctx.render()` return Response which will available inside page props `data` property.

If you want to view live demo you can go visit https://freshhub.deno.dev/

If you want to explore complete source code this is available on github






