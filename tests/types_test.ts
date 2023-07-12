import { AppProps, PageProps } from "$fresh/server.ts";
import { ComponentType } from "preact";
import { AssertTrue, IsExact } from "./deps.ts";

type SampleAppProps = {
  Component: ComponentType<Record<never, never>>;
} & PageProps<string, Record<string, unknown>>;

type appPropsTest = AssertTrue<
  IsExact<AppProps<string, Record<string, unknown>>, SampleAppProps>
>;
