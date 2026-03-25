import { define } from "../utils.ts";

export default define.page((props) => {
  if (props.error instanceof Error) {
    return <pre id="err">{String(props.error?.stack)}</pre>;
  }

  return <pre id="err">{String(props.error)}</pre>;
});
