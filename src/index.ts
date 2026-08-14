import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./app.js";
import { startMeasurer } from "./measure.js";

const port = Number(process.env.PORT ?? 3010);

serve({ fetch: app.fetch, port, hostname: "127.0.0.1" }, (info) => {
  console.log(`yantri listening on http://127.0.0.1:${info.port}`);
  startMeasurer();
});
