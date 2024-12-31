// 单线程模型文件转化
import {
  getDracoModels,
  clearDir,
  copyFile,
  replaceFile,
} from "./utils/tools.js";
import fs from "fs";
import { readDir } from "./utils/resizeImage.js";
import imageJoint from "./utils/imageJoint.js";
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
// optimizeImage();

const optimizeGltf = async () => {
  const sourcePath = "./map";
  const targetPath = "./export";

  await getDracoModels(sourcePath, targetPath);
};
// optimizeGltf();

// 替换文件
const replaceFiles = async () => {
  const sourcePath = "./export";
  const targetPath =
    "D:/workSpace/work/GHTX-MK001_20240411 (8)/GHTX-MK001_20240411_down/data/GHTX-MK001";

  await replaceFile(sourcePath, targetPath);
};
// replaceFiles();

// 图片拼接 imageJoint
const jointImage = async () => {
  const __dirname = path.resolve();
  const url = path.resolve(__dirname, "./screenshot638");

  const targetPath = path.resolve(__dirname, "./image_joint/res.png");
  const images = [];
  // 提取所有图片文件的url
  const files = fs.readdirSync(url);
  for (const file of files) {
    const fPath = path.join(url, file);
    // 如果是图片文件
    if (
      fPath.endsWith(".png") ||
      fPath.endsWith(".jpg") ||
      fPath.endsWith(".jpeg") ||
      fPath.endsWith(".webp") ||
      fPath.endsWith(".tiff") ||
      fPath.endsWith(".gif") ||
      fPath.endsWith(".svg")  ||
      fPath.endsWith(".avif")
    ) {
      images.push(fPath);
    }
  }

  // console.log("images", images);

  // 每行显示的图片数量
  const row = 29;
  const column = 22;
  // 图片拼接
  await imageJoint(images, targetPath, row, column);
};
jointImage();
