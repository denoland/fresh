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
      "the-canary-version": {
        title: "The canary version",
      },
      introduction: {
        title: "Introduction",
        link: "v1",
      },
      "getting-started": {
        title: "Getting Started",
        link: "v1",
        pages: [
          ["create-a-project", "Create a project", "link:v1"],
          ["running-locally", "Running locally", "link:v1"],
          ["create-a-route", "Create a route", "link:v1"],
          ["dynamic-routes", "Dynamic routes", "link:v1"],
          ["custom-handlers", "Custom handlers", "link:v1"],
          ["form-submissions", "Form submissions", "link:v1"],
          ["adding-interactivity", "Adding interactivity", "link:v1"],
          ["deploy-to-production", "Deploy to production", "link:v1"],
        ],
      },
      concepts: {
        title: "Concepts",
        link: "v1",
        pages: [
          ["architecture", "Architecture", "link:v1"],
          ["server-components", "Server Components", "link:v1"],
          ["routing", "Routing", "link:v1"],
          ["routes", "Routes", "link:v1"],
          ["app-wrapper", "App wrapper", "link:v1"],
          ["layouts", "Layouts", "link:v1"],
          ["forms", "Forms", "link:v1"],
          ["islands", "Interactive islands", "link:v1"],
          ["static-files", "Static files", "link:v1"],
          ["middleware", "Middlewares", "link:v1"],
          ["error-pages", "Error pages", "link:v1"],
          ["partials", "Partials", "link:v1"],
          ["data-fetching", "Data fetching", "link:v1"],
          ["ahead-of-time-builds", "Ahead-of-time Builds", "link:v1"],
          ["deployment", "Deployment", "link:v1"],
          ["plugins", "Plugins", "link:v1"],
          ["updating", "Updating Fresh", "link:v1"],
          ["server-configuration", "Server configuration", "link:v1"],
        ],
      },
      integrations: {
        title: "Integrations",
        link: "v1",
      },
      examples: {
        title: "Examples",
        link: "v1",
        pages: [
          ["migrating-to-tailwind", "Migrating to Tailwind", "link:canary"],
          ["modifying-the-head", "Modifying the <head>", "link:v1"],
          ["writing-tests", "Writing tests", "link:v1"],
          [
            "changing-the-src-dir",
            "Changing the source directory",
            "link:v1",
          ],
          ["using-twind-v1", "Using Twind v1", "link:v1"],
          ["init-the-server", "Initializing the server", "link:v1"],
          [
            "using-fresh-canary-version",
            "Using Fresh canary version",
            "link:v1",
          ],
          ["dealing-with-cors", "Dealing with CORS", "link:v1"],
          ["creating-a-crud-api", "Creating a CRUD API", "link:v1"],
          ["handling-complex-routes", "Handling complex routes", "link:v1"],
          ["rendering-markdown", "Rendering markdown", "link:v1"],
          ["rendering-raw-html", "Rendering raw HTML", "link:v1"],
          [
            "sharing-state-between-islands",
            "Sharing state between islands",
            "link:v1",
          ],
          ["using-csp", "Using CSP", "link:v1"],
          ["active-links", "Styling active links", "link:v1"],
        ],
      },
    },
  },
  v1: {
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
  v2: {
    label: "2.0.0-alpha",
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
          ["handlers-and-data-fetching", "Handlers & data fetching"],
          ["form-submissions", "Form submissions"],
          ["adding-interactivity", "Adding interactivity"],
          ["deploy-to-production", "Deploy to production"],
        ],
      },
    },
  },
};

export default toc;
