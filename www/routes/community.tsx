import { asset } from "fresh/runtime";
import { page } from "fresh";
import Header from "../components/Header.tsx";
import Footer from "../components/Footer.tsx";
import { define } from "../utils/state.ts";

const TITLE = "Community | Fresh";
const DESCRIPTION =
  "Join the Fresh community. Get help, contribute, and connect.";

export const handler = define.handlers({
  GET(ctx) {
    ctx.state.title = TITLE;
    ctx.state.description = DESCRIPTION;
    ctx.state.ogImage = new URL(asset("/og-image.webp"), ctx.url).href;
    return page();
  },
});

const links = [
  {
    title: "Discord",
    description:
      "Chat with the Fresh community and the Deno team. Get help, share what you're building, and hang out.",
    href: "https://discord.com/invite/deno",
    cta: "Join Discord",
  },
  {
    title: "GitHub",
    description:
      "Browse the source, report bugs, request features, and contribute code. Fresh is open source under the MIT license.",
    href: "https://github.com/denoland/fresh",
    cta: "View on GitHub",
  },
  {
    title: "Blog",
    description:
      "Release announcements, tutorials, and deep dives into Fresh features from the Deno team.",
    href: "https://deno.com/blog?tag=fresh",
    cta: "Read the blog",
  },
  {
    title: "Contributing",
    description:
      "Want to contribute? Check out the contributing guide for setup instructions, PR conventions, and how to run tests.",
    href: "/docs/latest/contributing",
    cta: "Read the guide",
  },
];

export default define.page<typeof handler>(function CommunityPage() {
  return (
    <div class="bg-white min-h-screen">
      <Header title="community" active="/community" />

      <div class="max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-16 2xl:px-0 py-16">
        <div class="flex flex-col gap-4 mb-12">
          <h1 class="text-4xl sm:text-5xl font-extrabold text-gray-800">
            Community
          </h1>
          <p class="text-xl text-gray-600 max-w-prose">
            Fresh is built in the open by the Deno team and contributors from
            around the world.
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {links.map((link) => (
            <a
              key={link.title}
              href={link.href}
              class="border border-gray-200 rounded-xl p-8 flex flex-col gap-3 hover:border-green-300 transition-colors group"
            >
              <h3 class="text-xl font-bold text-gray-800">{link.title}</h3>
              <p class="text-gray-600 flex-1">{link.description}</p>
              <span class="text-green-700 font-semibold group-hover:underline mt-2">
                {link.cta} →
              </span>
            </a>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
});
