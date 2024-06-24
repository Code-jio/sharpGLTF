// 单线程模型文件转化
import { getDracoModels } from "./utils/tools.js";

const sourcePath = "./map";
const targetPath = "./export";

getDracoModels(sourcePath, targetPath);

// // 多线程模型文件转化
// import { Worker } from "worker_threads";
// import { copyFile } from "./threads.js";

// const sourcePath = "./map";
// const targetPath = "./export";

// const worker = new Worker("./utils/threads.js", {
//   workerData: { sourcePath, targetPath },
// });
// worker.on("message", (message) => {
//   console.log(message, "message");
// });
// worker.on("error", (err) => {
//   console.error(err, "err");
// });
// worker.on("exit", (code) => {
//   if (code !== 0) {
//     console.error(`Worker stopped with exit code ${code}`);
//   }
// });