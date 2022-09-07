import {
  Confirm,
  prompt,
  Select,
} from "https://deno.land/x/cliffy@v0.25.0/prompt/mod.ts";

console.log(
  `\n%c  🍋 Fresh: the next-gen web framework.  %c\n`,
  "background-color: #86efac; color: black; font-weight: bold",
  "",
);

console.log("%cLet's set up your new Fresh project:\n", "font-weight: bold");

const result = await prompt([
  {
    type: Select,
    name: "styling",
    message: "How do you want to style your project?",
    options: [
      { value: "css", name: "Plain CSS" },
      { value: "twind", name: "Twind" },
    ],
  },
  {
    type: Confirm,
    name: "overwrite",
    message:
      "The output directory is not empty (files could get overwritten). Do you want to continue anyway?",
  },
]);

console.log("\n%cProject initialized!\n", "color: green; font-weight: bold");

console.log(
  "Enter your project directory using %ccd ./my-app%c.",
  "color: cyan",
  "",
);
console.log(
  "Run %cdeno task start%c to start the project. %cCTRL-C%c to stop.",
  "color: cyan",
  "",
  "color: cyan",
  "",
);
console.log();
console.log(
  "Stuck? Join our Discord %chttps://discord.gg/deno",
  "color: cyan",
  "",
);
console.log();
console.log(
  "%cHappy hacking! 🦕",
  "color: gray",
);

// console.log(result);
