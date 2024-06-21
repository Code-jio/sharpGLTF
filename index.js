// import { getDracoModels } from "./utils/tools.js";

// const sourcePath = "./map";
// const targetPath = "./export";

// getDracoModels(sourcePath, targetPath);

// Compare this snippet from utils/threads.js:
import { Worker } from "worker_threads";
import { copyFile } from "./threads.js";

const sourcePath = "./map";
const targetPath = "./export";

const worker = new Worker("./threads.js", {
  workerData: { sourcePath, targetPath },
});
worker.on("message", (message) => {
  console.log(message);
});
worker.on("error", (err) => {
  console.error(err);
});
worker.on("exit", (code) => {
  if (code !== 0) {
    console.error(`Worker stopped with exit code ${code}`);
  }
});