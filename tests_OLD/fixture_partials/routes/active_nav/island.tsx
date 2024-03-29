import LazyLink from "../../islands/LazyLink.tsx";

export default function Page() {
  return (
    <div>
      <h1>active nav island</h1>
      <LazyLink
        links={["/", "/active_nav", "/active_nav/foo", "/active_nav/island/"]}
      />
    </div>
  );
}
