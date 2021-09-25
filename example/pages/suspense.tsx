/** @jsx h */

import { h, Suspense, tw, useData } from "../deps.ts";

export default function SuspensePage() {
  return (
    <Suspense
      fallback={(
        <p class={tw`text-red-500 hover:text-purple-500`}>
          Loading...
        </p>
      )}
    >
      <SuspendedComponent />
    </Suspense>
  );
}

export function SuspendedComponent() {
  const data = useData("Loaded", delayer);
  return <p class={tw`text-blue-500 hover:text-green-500`}>{data}!</p>;
}

// A function that returns a promise that resolves after a delay with the given
// value.
function delayer(key: string) {
  return new Promise((resolve) => setTimeout(() => resolve(key), 2000));
}
