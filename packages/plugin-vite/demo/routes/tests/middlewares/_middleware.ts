import type { Middleware } from "@fresh/core";

const middleware1: Middleware<{ text: string }> = async (ctx) => {
  ctx.state.text = "A";
  return await ctx.next();
};

const middleware2: Middleware<{ text: string }> = async (ctx) => {
  ctx.state.text += "B";
  return await ctx.next();
};

export default [middleware1, middleware2];
