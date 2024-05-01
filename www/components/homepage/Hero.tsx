import LemonDrop from "$fresh/www/islands/LemonDrop.tsx";

export function Hero() {
  return (
    <div
      class="pt-20 -mt-20 relative -z-10 w-full flex justify-center items-center flex-col bg-gradient-to-tr from-yellow-200 via-green-300 to-blue-200"
      aria-hidden="true"
    >
      <LemonDrop />
    </div>
  );
}
