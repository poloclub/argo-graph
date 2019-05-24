/* eslint-disable global-require */

import { dialog } from "electron";

import { machineId } from "node-machine-id";
const isDevMode = process.execPath.match(/[\\/]electron/);

export default async function setupLogging() {
  if (!isDevMode) {
    if (process.type === "browser") {
      // main process
      const Raven = require("raven");
      Raven.config(
        "https://27e70e5b458a4efc951248c36e64660b:6feeab1aa1254663bdc4dcb15753f0b7@sentry.io/114113",
        {
          release: require("electron").app.getVersion(),
          id: await machineId()
        }
      ).install();

      process.on("uncaughtException", err => {
        dialog.showMessageBox({
          type: "error",
          message: "A JavaScript error occurred in the main process",
          detail: err.stack,
          buttons: ["OK"]
        });
      });
    } else if (process.type === "renderer") {
      // renderer process
      const Raven = require("raven-js");

      Raven.config(
        "https://27e70e5b458a4efc951248c36e64660b@sentry.io/114113",
        {
          release: require("electron").remote.app.getVersion(),
          id: await machineId()
        }
      ).install();
    }
  }
}
