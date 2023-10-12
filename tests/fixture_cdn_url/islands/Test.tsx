import { staticFile } from "../../../runtime.ts";

export default function Test(props: { message: string }) {
  return (
    <div>
      <p>{props.message}</p>
      <img
        id="img-in-island"
        src={staticFile("/image.png")}
        srcset={`${staticFile("/image.png")} 1x`}
        height={130}
      />
    </div>
  );
}
