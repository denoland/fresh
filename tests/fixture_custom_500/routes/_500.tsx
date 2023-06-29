import { ErrorPageProps } from "../../../server.ts";

export default function Error500Page({ error }: ErrorPageProps) {
  return <p class="custom-500">Custom 500: {(error as Error).message}</p>;
}
