/** @jsx h */
import { h } from "preact";
import { useState } from "preact/hooks";
import { IS_BROWSER } from "$fresh/runtime.ts";
import { tw } from "@twind";

export default function Create() {
    const [isCreating, setIsCreating] = useState(false);
    const [show, setShow] = useState(false);
    const [joke, setJoke] = useState("");
    const btn = tw`px-2 py-1 mt-2 border(gray-100 1) hover:bg-yellow-100 focus:outline-none`;
    const text = tw`p-0 text-xl mt-10 w-screen bg-yellow-100 text-center`;

    return (
        <div class={tw`flex flex-col items-center justify-center`}>
            {isCreating ? (
                <div
                    class={tw`flex flex-col items-center justify-center mt-10`}
                >
                    <input
                        class={tw`border(gray-100 1) rounded-md w-full text-lg py-1 px-2 focus:bg-yellow-100 focus:outline-none`}
                        type="text"
                        placeholder="Enter joke"
                        onChange={(e) => setJoke(e.target.value)}
                    />
                    <button
                        class={btn}
                        onClick={() => {
                            setShow(true);
                            setIsCreating(false);
                        }}
                    >
                        Submit
                    </button>
                </div>
            ) : (
                <button
                    class={btn}
                    onClick={() => {
                        setIsCreating(true);
                        setJoke("");
                    }}
                    disabled={isCreating}
                >
                    Make My Own!
                </button>
            )}
            {show && <p class={text}>{joke}</p>}
        </div>
    );
}
