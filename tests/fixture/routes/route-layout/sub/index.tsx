import { Handlers, PageProps } from "$fresh/server.ts";

export default function Page(props: PageProps<boolean>) {
  return <div>This content is from the sub page, not the layout</div>;
}
