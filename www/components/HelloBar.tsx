export default function HelloBar() {
  return (
    <a
      class="bg-gradient-to-r from-blue-200 to-yellow-200 via-green-300 text-black border-b border-green-400 p-4 text-center group sticky top-0 z-50"
      href="https://deno.com/blog/an-update-on-fresh"
    >
      News about <b>the upcoming Fresh 2</b>{" "}
      <span class="group-hover:underline">→</span>
    </a>
  );
}
