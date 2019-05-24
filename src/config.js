import fetch from "node-fetch";
import setupLogging from "./logging";

export async function setupConfig() {
  const r = await fetch("https://argo-graphvis.firebaseio.com/.json");
  const config = await r.json();
  if (config.sentry || process.env.ARGO_LOGGING) {
    setupLogging();
  }
}
