import fs from "fs";
import path from "path";
// 多线程
import { Worker } from "worker_threads";
// import { copyFile } from "./threads.js";
const fsp = fs.promises;

import { Document, NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

// import { generateTangents } from "mikktspace";
// import sharp from "sharp";

// import { ready, resample as resampleWASM } from "keyframe-resample";
import {
  resample,
  prune,
  dedup,
  draco,
  textureCompress,
  instance,
  flatten,
  reorder,
  join,
  normals,
  dequantizePrimitive,
  dequantize,
  palette,
  partition,
  simplify,
  weld,
  sparse,
  tangents,
  vertexColorSpace,
} from "@gltf-transform/functions";

/**
 * 递归遍历文件夹,记录所有文件路径，复制文件，并体现完整的文件层级结构
 * @param {String} src 源文件
 * @param {*} dest  复制文件
 */
export const copyFile = async (sourceDirPath, destDirPath) => {
  const dirFiles = fs.readdirSync(sourceDirPath);
  for (const file of dirFiles) {
    const filePath = path.join(sourceDirPath, file);
    const dest = path.join(destDirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      fs.mkdirSync(dest);
      copyFile(filePath, dest);
    } else {
      fs.copyFileSync(filePath, dest);
    }
  }
  console.log("复制完成");
};

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
    } else {
      if (file.endsWith(".gltf") || file.endsWith(".glb")) {
        files.push(filePath);
      }
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
      fs.rmSync(filePath, { recursive: true });
    } else {
      fs.unlinkSync(filePath);
    }
  }

  console.log("清空完成");
};


// 获取所有gltf/glb文件，并将其复制到指定文件夹，将该文件件下的所有gltf/glb转为draco格式
export const getDracoModels = async (importDir, exportDir) => {
  await clearDir(exportDir); // 清空目标目录下的所有文件
  
  await copyFile(importDir, exportDir); // 复制文件夹

  const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });
  await MeshoptEncoder.ready; // 等待meshoptimizer加载完成
  const files = await findModel(exportDir); // 获取所有gltf/glb文件
  // 读取所有的gltf文件，并转为draco格式
  for (const file of files) {    
    let document = await io.read(file);
    await document.transform(
      // draco({ compressionLevel: 10 }), // draco压缩
      // textureCompress({
        // targetFormat: "jpg",
        // resize: [1024, 1024],
      // }),
      // prune() // 删除未使用的节点、纹理或其他数据
    );

    // // 先删除原文件所在目录下的所有文件(避免出现重复图片)
    // const dir = path.dirname(file);
    // const dirFiles = fs.readdirSync(dir);
    // for (const file of dirFiles) {
    //   const filePath = path.join(dir, file);
    //   if (
    //     fs.statSync(filePath).isFile &&
    //     (file.endsWith(".jpg") ||
    //       file.endsWith(".png") ||
    //       file.endsWith(".jpeg"))
    //   ) {
    //     fs.unlinkSync(filePath);
    //     console.log(`删除文件：${filePath}`);
    //   }
    // }

    // 转为gltf格式并覆盖原文件
    await io.write(file, document);
    console.log(`转换完成：${file}`);
  }
};

/**
 * 查找文件夹下的所有gltf文件，将其复制到指定文件夹
 * @param {String} importDir 原文件夹
 * @param {String} targetDir 目标文件夹
 */
export const replaceFile = async (importDir, targetDir) => {
  // 递归查找importDir底下所有的gltf文件
  const files = findModel(importDir);
  for (const file of files) {
    // 提取文件名
    const fileName = path.basename(file);
    // 在targetDir底下递归查找同名文件
    const targetFiles = findModel(targetDir);
    for (const targetFile of targetFiles) {
      // 如果找到同名文件，则删除
      if (path.basename(targetFile) === fileName) {
        // 删除同名文件，将importDir底下的同名文件复制到targetDir
        fs.unlinkSync(targetFile);
        fs.copyFileSync(file, targetFile);
        console.log(`替换文件：${targetFile}`);
      }
    }
  }
}