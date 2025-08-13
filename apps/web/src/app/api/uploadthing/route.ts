import { createRouteHandler } from "uploadthing/next";

import { songFileRouter } from "./core";

// Export routes for Next App Router
export const { GET, POST } = createRouteHandler({
  router: songFileRouter,

  // Apply an (optional) custom config:
  // config: { ... },
});
