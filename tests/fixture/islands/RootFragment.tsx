import { useState } from "preact/hooks"

export default function RootFragment() {
    const [shown, setShown] = useState(false);

    return (
        <>
            Hello
            
            <div onClick={() => setShown(true)} id="root-fragment-click-me">
                World
            </div>

            {shown && (
                <div>I'm rendered now</div>
            )}
        </>
    );
}
