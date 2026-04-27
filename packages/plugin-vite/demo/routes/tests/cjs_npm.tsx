import qs from "qs";

export default function Page() {
  const parsed = qs.parse("a=1&b=2");
  return <h1>{parsed.a === "1" ? "qs-ok" : "qs-fail"}</h1>;
}
