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
        link: "latest",
      },
      "getting-started": {
        title: "Getting Started",
        link: "latest",
        pages: [
          ["create-a-project", "Create a project", "link:latest"],
          ["running-locally", "Running locally", "link:latest"],
          ["create-a-route", "Create a route", "link:latest"],
          ["dynamic-routes", "Dynamic routes", "link:latest"],
          ["custom-handlers", "Custom handlers", "link:latest"],
          ["form-submissions", "Form submissions", "link:latest"],
          ["adding-interactivity", "Adding interactivity", "link:latest"],
          ["deploy-to-production", "Deploy to production", "link:latest"],
        ],
      },
      concepts: {
        title: "Concepts",
        link: "latest",
        pages: [
          ["architecture", "Architecture", "link:latest"],
          ["server-components", "Server Components", "link:latest"],
          ["routing", "Routing", "link:latest"],
          ["routes", "Routes", "link:latest"],
          ["app-wrapper", "App wrapper", "link:latest"],
          ["layouts", "Layouts", "link:latest"],
          ["forms", "Forms", "link:latest"],
          ["islands", "Interactive islands", "link:latest"],
          ["static-files", "Static files", "link:latest"],
          ["middleware", "Middlewares", "link:latest"],
          ["error-pages", "Error pages", "link:latest"],
          ["partials", "Partials", "link:latest"],
          ["data-fetching", "Data fetching", "link:latest"],
          ["ahead-of-time-builds", "Ahead-of-time Builds", "link:latest"],
          ["deployment", "Deployment", "link:latest"],
          ["plugins", "Plugins", "link:latest"],
          ["updating", "Updating Fresh", "link:latest"],
          ["server-configuration", "Server configuration", "link:latest"],
        ],
      },
      integrations: {
        title: "Integrations",
        link: "latest",
      },
      examples: {
        title: "Examples",
        link: "latest",
        pages: [
          ["migrating-to-tailwind", "Migrating to Tailwind", "link:canary"],
          ["modifying-the-head", "Modifying the <head>", "link:latest"],
          ["writing-tests", "Writing tests", "link:latest"],
          [
            "changing-the-src-dir",
            "Changing the source directory",
            "link:latest",
          ],
          ["using-twind-v1", "Using Twind v1", "link:latest"],
          ["init-the-server", "Initializing the server", "link:latest"],
          [
            "using-fresh-canary-version",
            "Using Fresh canary version",
            "link:latest",
          ],
          ["dealing-with-cors", "Dealing with CORS", "link:latest"],
          ["creating-a-crud-api", "Creating a CRUD API", "link:latest"],
          ["handling-complex-routes", "Handling complex routes", "link:latest"],
          ["rendering-markdown", "Rendering markdown", "link:latest"],
          [
            "sharing-state-between-islands",
            "Sharing state between islands",
            "link:latest",
          ],
          ["using-csp", "Using CSP", "link:latest"],
          ["active-links", "Styling active links", "link:latest"],
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
