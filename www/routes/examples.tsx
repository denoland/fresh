import { asset } from "fresh/runtime";
import { page } from "fresh";
import Header from "../components/Header.tsx";
import Footer from "../components/Footer.tsx";
import { define } from "../utils/state.ts";


const TITLE = "Examples | Fresh";
const DESCRIPTION = "Practical examples of building with Fresh.";

export const handler = define.handlers({
  GET(ctx) {
    ctx.state.title = TITLE;
    ctx.state.description = DESCRIPTION;
    ctx.state.ogImage = new URL(asset("/og-image.webp"), ctx.url).href;
    return page();
  },
});

const examples = [
  {
    title: "Basic CRUD App",
    description:
      "A simple todo app with server-side form handling, demonstrating routes, handlers, and database integration.",
    tags: ["Forms", "Database", "Routes"],
  },
  {
    title: "Authentication",
    description:
      "Session-based auth with login, signup, and protected routes using middleware.",
    tags: ["Middleware", "Sessions", "Security"],
  },
  {
    title: "REST API",
    description:
      "Build a JSON API with Fresh handlers. Covers GET, POST, PUT, DELETE with proper status codes.",
    tags: ["API", "Handlers", "JSON"],
  },
  {
    title: "Real-time Chat",
    description:
      "WebSocket-powered chat using islands for the interactive UI and server-side message broadcasting.",
    tags: ["WebSocket", "Islands", "Real-time"],
  },
  {
    title: "File Uploads",
    description:
      "Handle file uploads with multipart form data, validation, and storage.",
    tags: ["Forms", "Files", "Handlers"],
  },
  {
    title: "Markdown Blog",
    description:
      "A static blog that renders Markdown files as pages with syntax highlighting and frontmatter.",
    tags: ["Static", "Markdown", "Blog"],
  },
];

export default define.page<typeof handler>(function ExamplesPage() {
  return (
    <div class="bg-white min-h-screen">
      <Header title="examples" active="/examples" />

      <div class="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-16 2xl:px-0 py-16">
        <div class="flex flex-col gap-4 mb-12">
          <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-800">
            Examples
          </h1>
          <p class="text-xl text-gray-600 max-w-prose">
            Practical, copy-paste examples to get you building with Fresh
            quickly. Each example is a complete, working project.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {examples.map((example) => (
            <div
              key={example.title}
              class="border border-gray-200 rounded-xl p-6 flex flex-col gap-3 hover:border-green-300 transition-colors"
            >
              <h3 class="text-lg font-bold text-gray-800">{example.title}</h3>
              <p class="text-gray-600 text-sm flex-1">{example.description}</p>
              <div class="flex flex-wrap gap-2 mt-2">
                {example.tags.map((tag) => (
                  <span
                    key={tag}
                    class="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div class="text-center mt-16 p-12 bg-gray-50 rounded-xl">
          <p class="text-gray-500 text-lg">
            More examples coming soon.{" "}
            <a
              href="https://github.com/denoland/fresh/issues"
              class="text-green-700 underline"
            >
              Suggest one
            </a>{" "}
            on GitHub.
          </p>
        </div>
      </div>

      <Footer />
    </div>
  );
});
