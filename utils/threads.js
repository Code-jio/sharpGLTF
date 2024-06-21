// 开启node多线程
import { Worker, isMainThread, parentPort, workerData } from "worker_threads"; // 引入多线程模块
import { URL } from "url";
import fs from "fs";
import path from "path";
const fsp = fs.promises;

// export const fileURLToPath = (url) => new URL(url).pathname;

// const __filename = fileURLToPath(import.meta.url);

// 多线程处理文件
export const copyFile = async (sourceDirPath, destDirPath) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./threads.js", {
      workerData: {
        sourceDirPath,
        destDirPath,
      },
    });
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
};

if (!isMainThread) {
  const { sourceDirPath, destDirPath } = workerData;
  const readStream = fs.createReadStream(sourceDirPath);
  const writeStream = fs.createWriteStream(destDirPath);
  readStream.pipe(writeStream);
  writeStream.on("close", () => {
    parentPort.postMessage(`${sourceDirPath} copied to ${destDirPath}`);
  });
}

/**
 *  递归查找文件夹下所有gltf文件,并记录文件路径
 * @param {String} dir 文件夹路径
 * @param {Array} files 文件数组
 * @returns  {Array}
 */
export const findModel = (dir, files = []) => {
  const dirFiles = fs.readdirSync(dir);
  for (const file of dirFiles) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findModel(filePath, files);
    }
    if (file.endsWith(".gltf") || file.endsWith(".glb")) {
      files.push(filePath);
    }
  }
  return files;
};

/**
 * 验证权限后，逐个删除文件夹下的每个文件
 * @param {*} importDir
 */
export const clearDir = async (importDir) => {
  // 验证目录是否可写
  try {
    await fsp.access(importDir, fs.constants.W_OK);
  } catch (err) {
    console.error(`${importDir}目录不可写`);
    return;
  }
  // 读取目录下的所有文件，逐个删除文件夹下的每个文件
  const dirFiles = fs.readdirSync(importDir);
  for (const file of dirFiles) {
    const filePath = path.join(importDir, file);
    if (fs.statSync(filePath).isDirectory()) {
      clearDir(filePath);
      fs.rmdirSync(filePath);
    } else {
      fs.unlinkSync(filePath);
    }
  }
  console.log("删除完成");
};

/**
 *
 * @param {String} sourcePath
 * @param {String} targetPath
 */
export const getDracoModels = async (sourcePath, targetPath) => {
  // 验证目录是否可读
  // try {
  //   await fsp.access(sourcePath, fs.constants.R_OK);
  // } catch (err) {
  //   console.error(`${sourcePath}目录不可读`);
  //   return;
  // }

  // 验证目录是否可写
  // try {
  //   await fsp.access(targetPath, fs.constants.W_OK);
  // } catch (err) {
  //   console.error(`${targetPath}目录不可写`);
  //   return;
  // }
  await clearDir(targetPath); // 清空目标目录下的所有文件
  const files = findModel(sourcePath); // 获取所有gltf/glb文件
  for (const file of files) {
    const dest = path.join(targetPath, path.basename(file));
    // 复制文件
    await copyFile(file, dest);
  }
  console.log("复制完成");
};

// Path: utils/tools.js
// Compare this snippet from index.js:
// // import { getDracoModels } from "./utils/tools.js";
//
// // const sourcePath = "./map";
// // const targetPath = "./export";
//
// // getDracoModels(sourcePath, targetPath);
//
// // Compare this snippet from utils/threads.js:
// import { Worker } from "worker_threads";
// import { copyFile } from "./threads.js";
//
// const sourcePath = "./map";
// const targetPath = "./export";
//
// const worker = new Worker("./threads.js", {
//   workerData: { sourcePath, targetPath },
// });
// worker.on("message", (message) => {
//   console.log(message);
// });
// worker.on("error", (err) => {
//   console.error(err);
// });
// worker.on("exit", (code) => {
//   if (code !== 0) {
//     console.error(`Worker stopped with exit code ${code}`);
//   }
// });
// 开启node多线程
// import { Worker, isMainThread } from "worker_threads"; // 引入多线程模块
// import { getDracoModels } from "./utils/tools.js";

const sourcePath = "../map/";
const targetPath = "../export/";

if (isMainThread) {
  getDracoModels(sourcePath, targetPath);
}
