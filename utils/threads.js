// 开启node多线程
import { Worker, isMainThread, parentPort, workerData } from "worker_threads"; // 引入多线程模块
import { URL } from "url";
import fs from "fs";
import path from "path";
const fsp = fs.promises;

// 将文件从源目录复制到目标目录
const copyFile = async (sourceDirPath, destDirPath) => {
  const readStream = fs.createReadStream(sourceDirPath); // 创建读取流
  const writeStream = fs.createWriteStream(destDirPath);
  readStream.pipe(writeStream); // 管道流
  writeStream.on("close", () => {
    console.log(`${sourceDirPath} copied to ${destDirPath}`);
  });
};

/**
 * 递归查找文件夹下所有gltf文件,并记录文件路径
 * @param {String} dir 文件夹路径
 * @param {Array} files 文件数组
 * @returns  {Array}
 */
const findModel = (dir, files = []) => {
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
 * 逐个删除文件夹下的每个文件
 * @param {*} importDir
 */
const clearDir = async (importDir) => {
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
 * 获取gltf/glb文件，并复制到目标目录
 * @param {String} sourcePath
 * @param {String} targetPath
 */
export const getDracoModels = async (sourcePath, targetPath) => {
  // 验证目录是否可读
  try {
    await fsp.access(sourcePath, fs.constants.R_OK); // 读取权限
    await fsp.access(targetPath, fs.constants.W_OK); // 写入权限
  } catch (err) {
    console.log(`对${sourcePath}目录不具备读写权限`, err);
    return;
  }

  await clearDir(targetPath); // 清空目标目录下的所有文件

  // 先将源目录下的所有文件都复制到目标目录
  await copyAllFiles(sourcePath, targetPath);

  console.log("复制完成");
};

/**
 * 将源目录下的所有文件复制到目标目录
 * @param {String} sourcePath
 * @param {String} targetPath
 */
const copyAllFiles = async (sourcePath, targetPath) => {
  // 遍历源目录下的所有文件
  const allFiles = fs.readdirSync(sourcePath);
  for (const file of allFiles) {
    const filePath = path.join(sourcePath, file);
    const destPath = path.join(targetPath, file);

    if (fs.statSync(filePath).isDirectory()) {
      fs.mkdirSync(destPath);
      // 递归查找file文件夹下的所有文件,复制至destPath
      copyAllFiles(filePath, destPath);
    } else {
      copyFile(filePath, destPath);
    }
  }
};

const sourcePath = "./map/";
const targetPath = "./export/";

function main() {
  if (isMainThread) {
    getDracoModels(sourcePath, targetPath);
  }
}

main();
