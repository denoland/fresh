import FRESH_VERSIONS from "../versions.json" with { type: "json" };

type RawTableOfContents = Record<
  string,
  {
    label: string;
    content: Record<string, RawTableOfContentsEntry>;
  }
>;

interface RawTableOfContentsEntry {
  title: string;
  link?: string;
  pages?: [string, string, string?][];
}

const toc: RawTableOfContents = {
  canary: {
    label: "canary",
    content: {
      introduction: {
        title: "Introduction",
        link: "canary",
      },
      "getting-started": {
        title: "Getting Started",
        link: "canary",
      },
      concepts: {
        title: "Concepts",
        link: "canary",
        pages: [
          ["app", "App", "link:canary"],
          ["middleware", "Middlewares", "link:canary"],
          ["context", "Context", "link:canary"],

          ["routing", "Routing", "link:canary"],

          ["islands", "Islands", "link:canary"],
          ["static-files", "Static files", "link:canary"],

          ["builder", "Builder", "link:canary"],
          ["file-routing", "File routing", "link:canary"],
        ],
      },
      advanced: {
        title: "Advanced",
        link: "canary",
        pages: [
          ["app-wrapper", "App wrapper", "link:canary"],
          ["layouts", "Layouts", "link:canary"],
          ["error-handling", "Error handling", "link:canary"],
          ["partials", "Partials", "link:canary"],
          ["forms", "Forms", "link:canary"],
          ["define", "Define Helpers", "link:canary"],
          ["environment-variables", "Environment Variables", "link:canary"],
          ["head", "Modifying <head>", "link:canary"],
        ],
      },
      deployment: {
        title: "Deployment",
        link: "canary",
        pages: [
          ["deno-deploy", "Deno Deploy", "link:canary"],
          ["deno-compile", "deno compile", "link:canary"],
          ["docker", "Docker", "link:canary"],
        ],
      },
      testing: {
        title: "Testing",
        link: "canary",
      },
      plugins: {
        title: "Plugins",
        link: "canary",
        pages: [
          ["cors", "cors", "link:canary"],
          ["csrf", "csrf", "link:canary"],
          ["trailing-slashes", "trailingSlashes", "link:canary"],
          ["tailwindcss", "tailwindcss", "link:canary"],
        ],
      },
      examples: {
        title: "Examples",
        link: "latest",
        pages: [
          ["migration-guide", "Migration Guide", "link:canary"],
          ["daisyui", "daisyUI", "link:canary"],
          ["creating-a-crud-api", "Creating a CRUD API", "link:latest"],
          ["markdown", "Rendering Markdown", "link:canary"],
          ["rendering-raw-html", "Rendering raw HTML", "link:canary"],
          [
            "sharing-state-between-islands",
            "Sharing state between islands",
            "link:latest",
          ],
          ["active-links", "Active links", "link:canary"],
        ],
      },
    },
  },
  latest: {
    label: FRESH_VERSIONS[0],
    content: {
      introduction: {
        title: "Introduction",
      },
      "getting-started": {
        title: "Getting Started",
        pages: [
          ["create-a-project", "Create a project"],
          ["running-locally", "Running locally"],
          ["create-a-route", "Create a route"],
          ["dynamic-routes", "Dynamic routes"],
          ["custom-handlers", "Custom handlers"],
          ["form-submissions", "Form submissions"],
          ["adding-interactivity", "Adding interactivity"],
          ["deploy-to-production", "Deploy to production"],
        ],
      },
      concepts: {
        title: "Concepts",
        pages: [
          ["architecture", "Architecture"],
          ["server-components", "Server Components"],
          ["routing", "Routing"],
          ["routes", "Routes"],
          ["app-wrapper", "App wrapper"],
          ["layouts", "Layouts"],
          ["forms", "Forms"],
          ["islands", "Interactive islands"],
          ["static-files", "Static files"],
          ["middleware", "Middlewares"],
          ["error-pages", "Error pages"],
          ["partials", "Partials"],
          ["data-fetching", "Data fetching"],
          ["ahead-of-time-builds", "Ahead-of-time Builds"],
          ["deployment", "Deployment"],
          ["plugins", "Plugins"],
          ["updating", "Updating Fresh"],
          ["server-configuration", "Server configuration"],
        ],
      },
      integrations: {
        title: "Integrations",
      },
      examples: {
        title: "Examples",
        pages: [
          ["migrating-to-tailwind", "Migrating to Tailwind"],
          ["modifying-the-head", "Modifying the <head>"],
          ["writing-tests", "Writing tests"],
          ["changing-the-src-dir", "Changing the source directory"],
          ["using-twind-v1", "Using Twind v1"],
          ["init-the-server", "Initializing the server"],
          ["using-fresh-canary-version", "Using Fresh canary version"],
          ["dealing-with-cors", "Dealing with CORS"],
          ["creating-a-crud-api", "Creating a CRUD API"],
          ["handling-complex-routes", "Handling complex routes"],
          ["rendering-markdown", "Rendering markdown"],
          ["rendering-raw-html", "Rendering raw HTML"],
          ["sharing-state-between-islands", "Sharing state between islands"],
          ["using-csp", "Using CSP"],
          ["active-links", "Styling active links"],
          [
            "client-side-components-and-libraries",
            "Client only side components",
          ],
        ],
      },
    },
  },
};

export default toc;
