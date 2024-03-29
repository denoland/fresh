import LazyLink from "../../islands/LazyLink.tsx";

export default function Page() {
  return (
    <div>
      <h1>active nav island</h1>
      <LazyLink
        links={[
          "/",
          "/active_nav_partial",
          "/active_nav_partial/foo",
          "/active_nav_partial/island/",
        ]}
      />
    </div>
  );
}
