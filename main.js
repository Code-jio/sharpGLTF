import path from 'path';
import { walkDirectory, ensureDirectory, getRelativePath } from './utils/tools.js';
import { NodeIO } from '@gltf-transform/core';
import { optimizePipeline } from './optimize-pipeline.js';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
// import { KHRONOS_texture_basisu } from '@gltf-transform/ktx2';
import * as draco3d from 'draco3dgltf';
import { generateLODs, saveLODModels } from './utils/lod-generator.js';
import { 
  writeModelWithConfig, 
  parseOutputConfigFromArgs, 
  displayOutputConfig 
} from './utils/output-utils.js';

// 模型优化处理函数
async function optimizeModel(inputPath, outputDir, relativePath, generateLODLevels = false, outputConfig = {}) {
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

  // 使用新的输出配置系统
  const outputPaths = await writeModelWithConfig(
    io, 
    document, 
    inputPath, 
    outputDir, 
    relativePath, 
    outputConfig
  );
  
  // 如果需要生成LOD级别
  if (generateLODLevels) {
    console.log(`开始为模型生成LOD级别: ${inputPath}`);
    
    // 生成LOD模型
    const lodModels = await generateLODs(document);
    
    // 为每个输出格式保存LOD模型
    for (const outputPath of outputPaths) {
      const outputBasePath = outputPath.replace(/\.(glb|gltf)$/i, '');
      const modelName = path.basename(outputBasePath);
      await saveLODModels(lodModels, io, outputBasePath, modelName);
    }
    
    console.log(`LOD生成完成: ${inputPath}`);
  }
  
  return { document, outputPaths };
}

// 批量处理入口
async function processModels(generateLOD = false, outputConfig = {}) {
  const SOURCE_DIR = './model';
  // const SOURCE_DIR = './test';
  const TARGET_DIR = './export';

  try {
    const files = walkDirectory(SOURCE_DIR)
      .filter(file => !file.isDirectory && ['.glb', '.gltf'].includes(path.extname(file.path)));

    console.log(`找到 ${files.length} 个模型文件需要处理`);
    
    // 显示输出配置
    displayOutputConfig(outputConfig);
    
    let processedCount = 0;
    let failedCount = 0;
    const startTime = Date.now();
    
    for (const { path: filePath } of files) {
      try {
        const relativePath = getRelativePath(SOURCE_DIR, filePath);
        
        console.log(`\n[${processedCount + 1}/${files.length}] 正在处理: ${filePath}`);
        
        const result = await optimizeModel(
          filePath, 
          TARGET_DIR, 
          relativePath, 
          generateLOD,
          outputConfig
        );
        
        processedCount++;
        console.log(`✓ 完成处理，输出 ${result.outputPaths.length} 个文件`); 
      } catch (err) {
        failedCount++;
        console.error(`✗ 处理${filePath}时出错:`, err.message); 
      }
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    console.log('\n🎉 批量处理完成!');
    console.log(`📊 处理统计:`);
    console.log(`   成功: ${processedCount}/${files.length}`);
    console.log(`   失败: ${failedCount}/${files.length}`);
    console.log(`   耗时: ${duration}秒`);
    
    if (failedCount > 0) {
      console.log(`⚠️  有 ${failedCount} 个文件处理失败，请检查错误信息`);
    }
    
  } catch (err) {
    console.error('目录遍历错误:', err.message);
  }
}

// 显示使用帮助
function showHelp() {
  console.log(`
    📖 使用说明:

    基本用法:
      node main.js                          # 使用默认设置处理模型
      node main.js --lod                    # 生成LOD级别
      
    输出格式控制:
      node main.js --format glb             # 只输出GLB格式
      node main.js --format gltf            # 只输出GLTF格式
      node main.js --format both            # 输出两种格式
      node main.js --format preserve        # 保持原格式(默认)
      
    命名和目录选项:
      node main.js --naming suffix          # 文件名添加格式后缀
      node main.js --naming custom          # 使用自定义命名
      node main.js --directory separate     # 按格式分目录存放
      node main.js --no-overwrite           # 不覆盖已存在文件
      
    组合使用:
      node main.js --lod --format both --naming suffix
      node main.js --format glb --directory separate
      
    支持的格式: glb, gltf, both, preserve
    支持的命名: preserve, suffix, custom  
    支持的目录: mixed, separate
`);
}

// 解析命令行参数
const args = process.argv.slice(2);

// 检查是否显示帮助
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 解析参数
const generateLOD = args.includes('--lod') || args.includes('-l');
const outputConfig = parseOutputConfigFromArgs(args);

// 显示启动信息
console.log('🚀 启动 glTF 模型优化器');

if (generateLOD) {
  console.log('📊 将为模型生成LOD级别');
}

// 验证输出配置并显示
try {
  if (Object.keys(outputConfig).length > 0) {
    console.log('🔧 检测到自定义输出配置');
  }
} catch (error) {
  console.error('❌ 输出配置错误:', error.message);
  console.log('请使用 --help 查看正确的参数格式');
  process.exit(1);
}

// 执行处理
processModels(generateLOD, outputConfig);