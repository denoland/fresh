import { defineApp } from "$fresh/server.ts";

export default defineApp((req, { Component }) => {
  return (
    <div class="app">
      <Component />
    </div>
  );
});
