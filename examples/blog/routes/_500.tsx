/** @jsx h */
import { h } from "preact";
import { ErrorPageProps } from "$fresh/server.ts";
import Layout from "components/Layout.tsx";

export default function Error500Page({ error }: ErrorPageProps) {
  return (
    <Layout title={"Error-404"}>
      <p>
        500 internal error: {(error as Error).message}{" "}
        <a href="/">Head back home</a>
      </p>
    </Layout>
  );
}
