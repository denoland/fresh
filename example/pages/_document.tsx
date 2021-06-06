import { h, setup } from "../deps.ts";
import {
  getStyleTagProperties,
  StyleTagProperties,
  virtualSheet,
} from "https://esm.sh/twind/sheets";
import {
  DocumentProps,
  DocumentRenderOptions,
  DocumentRenderReturn,
} from "../../server.ts";

interface Data {
  styleTag: StyleTagProperties;
}

export default function Document({ Head, Main, data }: DocumentProps<Data>) {
  return (
    <html>
      <Head>
        <style
          id={data.styleTag.id}
          dangerouslySetInnerHTML={{ __html: data.styleTag.textContent }}
        />
      </Head>
      <body>
        <Main />
      </body>
    </html>
  );
}

const sheet = virtualSheet();
setup({ sheet });

export function render(
  { render }: DocumentRenderOptions,
): DocumentRenderReturn<Data> {
  sheet.reset();
  render();
  const styleTag = getStyleTagProperties(sheet);
  return { data: { styleTag } };
}
