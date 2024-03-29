import { tw } from "https://esm.sh/@twind/core@1.1.3";

export default function Unused() {
  // @ts-ignore twind types are wrong
  tw`text-green-500`;
  const _unused = <div class="text-red-600" />;
  // @ts-ignore twind types are wrong
  return <h1 class={tw`text-blue-500`}>ready</h1>;
}
