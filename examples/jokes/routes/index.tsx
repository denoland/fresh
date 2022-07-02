/** @jsx h */
import { h } from "preact";
import { tw } from "@twind";
import Joke from "../islands/Joke.tsx";
import Create from "../islands/Create.tsx";

export default function Home() {
    return (
        <main
            class={tw`p-0 m-0 h-screen w-screen flex flex-col items-center justify-center`}
        >
            <h1 class={tw`p-0 m-2 text-2xl font-bold text-center`}>
                Your daily dose of `fresh` jokes!
            </h1>
            <Joke index={0} />
            <Create />
        </main>
    );
}
