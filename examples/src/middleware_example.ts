import { App } from "../src/app.ts";

// Create a new Fresh app
const app = new App();

// Global middleware (applied to all paths)
app.use(async (ctx, next) => {
  console.log(`Request: ${ctx.url.pathname}`);
  console.time("Request duration");

  try {
    return await next();
  } finally {
    console.timeEnd("Request duration");
  }
});

// Path-specific middleware for API routes
app.use("/api/*", async (ctx, next) => {
  console.log("API request");

  // Add CORS headers for API routes
  const response = await next();
  response.headers.set("Access-Control-Allow-Origin", "*");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization",
  );

  return response;
});

// Path-specific middleware for authenticated routes with multiple middleware functions
app.use("/admin/*", // Auth check middleware
async (ctx, next) => {
  console.log("Admin authentication check");

  // Check if Authorization header exists
  if (!ctx.request.headers.has("Authorization")) {
    return new Response("Unauthorized", { status: 401 });
  }

  return await next();
}, // Logging middleware specific to admin routes
async (ctx, next) => {
  console.log(`Admin action: ${ctx.url.pathname}`);
  return await next();
});

// Path with URL parameters
app.use("/users/:id", async (ctx, next) => {
  console.log(`Accessing user: ${ctx.params.id}`);
  return await next();
});

// Routes
app.get("/", () => new Response("Home page"));
app.get(
  "/api/data",
  () => new Response(JSON.stringify({ message: "API data" })),
);
app.get("/admin/dashboard", () => new Response("Admin dashboard"));
app.get("/users/123", () => new Response("User 123 profile"));

// Start the server
await app.listen({ port: 8000 });
