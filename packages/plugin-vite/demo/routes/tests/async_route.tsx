import { define } from "../../utils.ts";

export default define.page(function Page() {
  // returning a promise without using async/await
  return Promise.resolve(<h1>async_route</h1>);
});
