---
description: |
  Using progressive web app!
---

With progressive web app you can make your app:

- Installable like native app
- run without internet connection
- get access to notification
- etc..

## Make it installable

to make your app installable you need called `webmanifest` is json file contains
all about your app

### Create Webmanifest

- Add `manifest.webmanifest` or `manifest.json` in `static/` directory

now your workspace project like this:

```diff
.
├── README.md
├── components
│   └── Button.tsx
├── deno.json
├── dev.ts
├── fresh.gen.ts
├── islands
│   └── Counter.tsx
├── main.ts
├── routes
│   ├── api
│   │   └── joke.ts
│   ├── _404.tsx
│   └── index.tsx
└── static
+   ├── manifest.webmanifest
    ├── favicon.ico
    └── logo.svg
```

- insert this in `manifest`

> Change `Foo | bar | baz` with your own

```json
{
  "name": "Foo",
  "short_name": "Foo bar",
  "description": "Foo bar baz",
  "id": "/",
  "scope": "/",
  "start_url": "/",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6",
  "display": "standalone",
  "icons": [
    {
      "src": "foo-48x48.png",
      "type": "image/png",
      "sizes": "48x48",
      "purpose": "maskable"
    },
    {
      "src": "foo-icon-144x144.png",
      "type": "image/png",
      "sizes": "144x144",
      "purpose": "any"
    },
    {
      "src": "foo-icon-512x512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "screenshots": [
    {
      "src": "foo-ss.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Notes in Mac"
    }
  ],
  "display_override": ["standalone", "window-controls-overlay"],
  "shortcuts": [
    {
      "name": "Foo bar",
      "short_name": "Foo",
      "description": "Foo bar baz",
      "url": "/foo",
      "icons": [
        {
          "src": "foo-192x192.png",
          "sizes": "192x192"
        }
      ]
    }
  ]
}
```

- Change your `<Head><Head>`

Add link to `manifest` in `<Head></Head>`

```diff
<Head>
  ...
+ <link rel="manifest" href="manifest.webmanifest">
+ <link rel="apple-touch-icon" href="foo-icon-48x48.png" />
+ <meta name="theme-color" content="#3b82f6" />
</Head>
```

> the `apple-touch-icon` need for apple device

> `theme-color` for your theme bar in your app

Now your app installable 🚀

But your app is not ready to offline

## Service Worker

Service worker is `javascript` file to make your app work like native app. With
service worker your app can:

- Access notification
- Access in offline mode
- Control cache

Let's add simple offline fallback in your app

### Create Service Worker

- Create `app.js` and `sw.js` in `static/` directory

```diff
.
├── README.md
├── components
│   └── Button.tsx
├── deno.json
├── dev.ts
├── fresh.gen.ts
├── islands
│   └── Counter.tsx
├── main.ts
├── routes
│   ├── api
│   │   └── joke.ts
│   ├── _404.tsx
│   └── index.tsx
└── static
    ├── manifest.webmanifest
+   ├── sw.js
+   ├── app.js
    ├── favicon.ico
    └── logo.svg
```

- Update your `<Head></Head>`

```diff
<Head>
  ...
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="apple-touch-icon" href="foo-icon-48x48.png" />
+ <script src="/app.js" type="module"></script>
  <meta name="theme-color" content="#3b82f6" />
</Head>
```

add this code in `app.js` to register your service worker

```js
if ("serviceWorker" in navigator) {
  const registration = await navigator.serviceWorker.register(
    "/service-worker.js",
  );
  console.info(
    `Service worker registered with scope: ${registration.scope}`,
  );
}
```

add this code to `sw.js` to add offline fallback in your app

> This is simple service worker to add offline fallback page, you can use more
> complex logic

```js
addEventListener("install", (event) => event.waitUntil(registerCache()));
addEventListener("fetch", (event) => event.respondWith(handleCache(event)));

// open cache storage
async function openCache() {
  return caches.open("foo-bar");
}

//register cache
async function registerCache() {
  const cache = await openCache();
  // static file to cache
  const urlsToCache = ["/", "/favicon.ico", "logo.svg"];
  console.info("Service worker caching all");

  await cache.addAll(urlsToCache);
}

// handle offline fallback
async function handleCache(networkEvent) {
  try {
    console.info("Service Worker Trying Fetch from Network");

    return await fetch(networkEvent.request);
  } catch (error) {
    console.info(`${error} | Service Worker using cache`);
    const cache = await openCache();
    // cache.match for fallback page is "/"
    // your can change page like /offline.html
    return cache.match(networkEvent.request);
  }
}
```
