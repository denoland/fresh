# Contributing to Fresh

Thank you for deciding to help the project 💛

## Before you hop in...

Fresh is using the [Contributor Covenant](https://www.contributor-covenant.org/) as its Code of Conduct. To better understand what actions will and will not be tolerated you can read the full text [here](/CODE_OF_CONDUCT.md).

## "How can I help?"

Even the smallest contribution is very valuable for any open source project and Fresh is not an exception.

Here's the list of things you can do:

#### Create issues.

It is one of the most impactful things you can do! It is always welcomed if you point out a bug or suggest an improvement. There are many people that would love to fix these bugs or discuss if any feature is worth being added. Don't be afraid to point out even the smallest things that might seem insignificant.

#### Contribute to the documentation.

There are always things in the [documentation](https://fresh.deno.dev/docs/introduction) that can be added or improved. You can look through some of the [closed](https://github.com/denoland/fresh/issues?q=is%3Aissue+is%3Aclosed) or [opened](https://github.com/denoland/fresh/issues?q=is%3Aissue+is%3Aopen) issues to better understand what needs to be added.

#### Provide the translation.

Fresh is a relatively new project and is currently only available in English. It would be great to make the documentation available in other languages!

#### Participate in discussions.

Fresh is a very active and welcoming community. You can visit the [discussions](https://github.com/denoland/fresh/discussions) page to ask questions or talk about the framework, and there will always be people who will answer you.

#### Create pull requests

We always welcome other people's changes. Don't be afraid to create pull requests if there is an issue you can close or a typo you can fix. If you want to add something big — we suggest that you first create an issue about it, so that your improvement can be discussed before you get to work.

## Code standards

Fresh is an open source project, which means we need to adopt some code conventions and common practices so that it look and work the same across the entire codebase.

_(be aware that the below list might and will change over time)_

1. For code formatting use `$ deno fmt` and nothing else.

2. If you are using VSCode, we suggest you install the official [Deno extension](https://marketplace.visualstudio.com/items?itemName=denoland.vscode-deno) which provides great support for Deno and its tooling. Fresh also has `.vscode/settings.json` file with `"editor.defaultFormatter": "denoland.vscode-deno"` setting which should force VSCode to automatically apply the correct `deno fmt` formatting if you have the extension installed.
3. Test your new features. Tests live in `/tests` folder, they should end with `_test.ts` and can be run with `$ deno task test`.
4. Fresh uses TypeScript for all its source code that's why we expect all new code to be written in TypeScript too.
