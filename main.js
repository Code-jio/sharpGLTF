import path from 'path';
import { walkDirectory, ensureDirectory, getRelativePath } from './utils/tools.js';
import { NodeIO } from '@gltf-transform/core';
import { optimizePipeline } from './optimize-pipeline.js';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
// import { KHRONOS_texture_basisu } from '@gltf-transform/ktx2';
import * as draco3d from 'draco3dgltf';
import { generateLODs, saveLODModels } from './utils/lod-generator.js';

// 模型优化处理函数
async function optimizeModel(inputPath, outputPath, generateLODLevels = false) {
  const io = new NodeIO()
    .registerExtensions([
      ...ALL_EXTENSIONS,
    //   KHRONOS_texture_basisu
    ])
    .registerDependencies({
      "draco3d.decoder": await draco3d.createDecoderModule(),
      "draco3d.encoder": await draco3d.createEncoderModule(),
      "meshopt.decoder": MeshoptEncoder,
      "meshopt.encoder": MeshoptSimplifier,
    //   "ktx-framework": new KHRONOS_texture_basisu()
    });

  await MeshoptEncoder.ready;
//   await MeshoptEncoder.registerEncoder();
//   await MeshoptEncoder.registerDecoder();
  const document = await io.read(inputPath);

  await optimizePipeline(document);

  ensureDirectory(path.dirname(outputPath));
  await io.write(outputPath, document);
  console.log(`标准优化模型已保存: ${outputPath}`);
  
  // 如果需要生成LOD级别
  if (generateLODLevels) {
    console.log(`开始为模型生成LOD级别: ${inputPath}`);
    
    // 生成LOD模型
    const lodModels = await generateLODs(document);
    
    // 保存LOD模型和配置文件
    const outputBasePath = outputPath.replace(/\.(glb|gltf)$/i, '');
    const modelName = path.basename(outputBasePath);
    await saveLODModels(lodModels, io, outputBasePath, modelName);
    
    console.log(`LOD生成完成: ${inputPath}`);
  }
  
  return document;
}

// 批量处理入口
async function processModels(generateLOD = false) {
  const SOURCE_DIR = './model';
  // const SOURCE_DIR = './test';
  const TARGET_DIR = './export';

  try {
    const files = walkDirectory(SOURCE_DIR)
      .filter(file => !file.isDirectory && ['.glb', '.gltf'].includes(path.extname(file.path)));

    console.log(`找到 ${files.length} 个模型文件需要处理`);
    
    for (const { path: filePath } of files) {
      try {
        const relativePath = getRelativePath(SOURCE_DIR, filePath);
        const outputPath = path.join(TARGET_DIR, relativePath, path.basename(filePath));
        
        console.log(`正在处理: ${filePath}`);
        await optimizeModel(filePath, outputPath, generateLOD);
        console.log(`完成: ${outputPath}`); 
      } catch (err) {
        console.error(`处理${filePath}时出错:`, err.message); 
      }
    }
    
    console.log('所有模型处理完成!');
  } catch (err) {
    console.error('目录遍历错误:', err.message);
  }
}

// 读取命令行参数
const args = process.argv.slice(2);
const generateLOD = args.includes('--lod') || args.includes('-l');

if (generateLOD) {
  console.log('将为模型生成LOD级别');
}

// 执行处理
processModels(generateLOD);