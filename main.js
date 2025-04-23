import path from 'path';
import { walkDirectory, ensureDirectory, getRelativePath } from './utils/tools.js';
import { NodeIO } from '@gltf-transform/core';
import { textureCompress } from '@gltf-transform/functions';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";

import * as draco3d from 'draco3dgltf';


// 模型优化处理函数
async function optimizeModel(inputPath, outputPath) {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
    });

  await MeshoptEncoder.ready;
  const document = await io.read(inputPath);

  await document.transform(
    textureCompress({
      resize: [1024, 1024]
    }),
    du

  );

  ensureDirectory(path.dirname(outputPath));
  await io.write(outputPath, document);
}

// 批量处理入口
async function processModels() {
  const SOURCE_DIR = './model';
  const TARGET_DIR = './export';

  try {
    const files = walkDirectory(SOURCE_DIR)
      .filter(file => !file.isDirectory && ['.glb', '.gltf'].includes(path.extname(file.path)));

    for (const { path: filePath } of files) {
      try {
        const relativePath = getRelativePath(SOURCE_DIR, filePath);
        const outputPath = path.join(TARGET_DIR, relativePath, path.basename(filePath));
        
        console.log(`正在处理: ${filePath}`);
        await optimizeModel(filePath, outputPath);
        console.log(`完成: ${outputPath}`); 
      } catch (err) {
        console.error(`Error processing ${filePath}:`, err.message); 
      }
    }
  } catch (err) {
    console.error('Directory traversal error:', err.message);
  }
}

// 执行处理
processModels();