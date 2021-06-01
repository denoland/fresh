import { oak } from "../../api_deps.ts";

export default (ctx: oak.Context) => {
  ctx.response.body = { name: "fresh" };
};
