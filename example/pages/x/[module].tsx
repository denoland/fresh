import { h, PageConfig, PageProps, useData } from "../../deps.ts";

export default function ModuleInfoPage({ params }: PageProps) {
  const module = params.module;

  if (module.includes("/")) {
    return <div>Invalid module name.</div>;
  }

  const url = `https://cdn.deno.land/${params.module}/meta/versions.json`;
  const info = useData(url, fetcher);

  if (info === null) {
    return <div>No module found with name `{params.module}`.</div>;
  }

  const { latest, versions } = info;
  return (
    <p>
      The module `{params.module}` has {versions.length} versions, with {latest}
      {" "}
      being the most recent.
    </p>
  );
}

interface ModuleInfo {
  latest: string;
  versions: string[];
}

async function fetcher(url: string): Promise<ModuleInfo | null> {
  const resp = await fetch(url);
  if (resp.status === 200) return resp.json();
  return null;
}

export const config: PageConfig = { runtimeJS: false };
