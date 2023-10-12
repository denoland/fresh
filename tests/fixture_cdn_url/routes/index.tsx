import { staticFile } from "../../../runtime.ts";
import Test from "../islands/Test.tsx";

export default function Page() {
  return (
    <div>
      <img id="static-img" src={staticFile("/image.png")} />
      <img
        id="static-img-with-srcset"
        src={staticFile("/image.png")}
        srcset={`${staticFile("/image.png")} 1x`}
        height={130}
      />
      <Test message="img In island" />
      <a id="static-file-with-helper" href={staticFile("/brochure.pdf")}>
        View brochure
      </a>
      <img
        id="external-img"
        src="https://fresh.deno.dev/favicon.ico"
      />
    </div>
  );
}
