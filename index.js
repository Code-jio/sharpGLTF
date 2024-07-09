// 单线程模型文件转化
import { getDracoModels, clearDir, copyFile, replaceFile } from "./utils/tools.js";
import { readDir } from "./utils/resizeImage.js";
import path from "path";

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

// // 根据指令执行文件转化
// const args = process.argv.slice(2);
// if (args.length === 0) {
//   console.log("请输入参数");
// } else {
//   if (args[0] === "sharp-image") {
//     console.log("开始转化图片");

//     const __dirname = path.resolve();

//     const url = path.resolve(__dirname, "./image");
//     const targetPath = path.resolve(__dirname, "./image_resize");

//     readDir(url, targetPath);
//   } else if (args[0] === "sharp-gltf") {
//     console.log("开始转化gltf文件");

//     const sourcePath = "./map";
//     const targetPath = "./export";

//     getDracoModels(sourcePath, targetPath);
//   }
// }

// 图片优化
const optimizeImage = async () => {
  const __dirname = path.resolve();

  const url = path.resolve(__dirname, "./image");
  const targetPath = path.resolve(__dirname, "./image_resize");

  // 清空targetPath文件夹
  await clearDir(targetPath);
  // 复制文件夹
  await copyFile(url, targetPath);
  // 读取文件夹
  await readDir(url);
};
optimizeImage();


const optimizeGltf = async () => {
  const sourcePath = "./map";
  const targetPath = "./export";

  await getDracoModels(sourcePath, targetPath);
}
// optimizeGltf();

// 替换文件
const replaceFiles = async () => {
  const sourcePath = "./export";
  const targetPath = "D:/workSpace/work/GHTX-MK001_20240411 (8)/GHTX-MK001_20240411_down/data/GHTX-MK001";

  await replaceFile(sourcePath, targetPath);
}
// replaceFiles();