/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";
import JOKES from "../utils/jokes.ts";

interface Props {
    index: number;
}

export default function Joke(props: Props) {
    const [index, setIndex] = useState(props.index);
    const btn = tw`px-2 py-1 border(gray-100 1) hover:bg-yellow-100 w-max focus:outline-none mt-4`;
    const text = tw`p-0 m-2 text-xl`;

    return (
        <div class={tw`flex flex-col items-center justify-center`}>
            <p class={text}>{JOKES[index]}</p>
            <button
                class={btn}
                onClick={() => setIndex(Math.floor(Math.random() * 10))}
                disabled={!IS_BROWSER}
            >
                Another One!
            </button>
        </div>
    );
}
