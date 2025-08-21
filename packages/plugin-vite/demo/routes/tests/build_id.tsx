import { BUILD_ID } from "@fresh/build-id";

export const handler = () => new Response(BUILD_ID);
