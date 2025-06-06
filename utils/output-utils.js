/**
 * 输出工具函数
 * 处理模型文件的输出逻辑、路径生成和格式转换
 */
import path from 'path';
import fs from 'fs';
import { outputConfig, getDefaultFormat, mergeOutputConfig } from '../config/output-config.js';

/**
 * 根据配置生成输出文件路径
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 * @param {string} relativePath - 相对路径
 * @param {string} format - 输出格式 ('glb', 'gltf')
 * @param {object} config - 输出配置
 * @returns {string} 生成的输出路径
 */
export function generateOutputPath(inputPath, outputDir, relativePath, format, config) {
  const inputName = path.basename(inputPath, path.extname(inputPath));
  const formatSettings = outputConfig[format];
  const namingStrategy = outputConfig.naming[config.naming];
  const directoryStrategy = outputConfig.directory[config.directory];

  // 生成文件名
  let fileName;
  switch (config.naming) {
    case 'suffix':
      fileName = `${inputName}_${format}${formatSettings.extension}`;
      break;
    case 'custom':
      fileName = `${inputName}_optimized${formatSettings.extension}`;
      break;
    case 'preserve':
    default:
      fileName = `${inputName}${formatSettings.extension}`;
      break;
  }

  // 生成目录路径
  let outputPath;
  switch (config.directory) {
    case 'separate':
      outputPath = path.join(outputDir, format, path.dirname(relativePath), fileName);
      break;
    case 'mixed':
    default:
      outputPath = path.join(outputDir, path.dirname(relativePath), fileName);
      break;
  }

  return path.normalize(outputPath);
}

/**
 * 确保目录存在
 * @param {string} filePath - 文件路径
 */
export function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * 检查文件是否已存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} 文件是否存在
 */
export function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * 根据格式配置获取写入选项
 * @param {string} format - 输出格式
 * @returns {object} 写入选项
 */
export function getWriteOptions(format) {
  const formatConfig = outputConfig[format];
  
  const options = {};
  
  if (format === 'gltf') {
    // GLTF 特定选项
    if (formatConfig.pretty) {
      options.pretty = true;
    }
    if (!formatConfig.embedImages) {
      options.embedImages = false;
    }
  } else if (format === 'glb') {
    // GLB 特定选项
    if (formatConfig.binary) {
      options.binary = true;
    }
  }
  
  return options;
}

/**
 * 写入单个格式的模型文件
 * @param {object} io - NodeIO 实例
 * @param {object} document - glTF 文档对象
 * @param {string} outputPath - 输出路径
 * @param {string} format - 输出格式
 * @param {object} config - 输出配置
 * @returns {Promise<void>}
 */
export async function writeModelFile(io, document, outputPath, format, config) {
  // 确保输出目录存在
  ensureDirectoryExists(outputPath);
  
  // 检查文件是否存在且是否允许覆盖
  if (fileExists(outputPath) && !config.overwrite) {
    console.log(`跳过已存在的文件: ${outputPath}`);
    return;
  }
  
  // 获取写入选项
  const writeOptions = getWriteOptions(format);
  
  try {
    // 写入文件
    await io.write(outputPath, document, writeOptions);
    
    const fileSize = fs.statSync(outputPath).size;
    const fileSizeKB = (fileSize / 1024).toFixed(2);
    
    console.log(`✓ ${format.toUpperCase()} 已保存: ${outputPath} (${fileSizeKB} KB)`);
  } catch (error) {
    console.error(`✗ 写入 ${format.toUpperCase()} 失败: ${outputPath}`, error.message);
    throw error;
  }
}

/**
 * 根据配置输出模型文件（支持多格式）
 * @param {object} io - NodeIO 实例
 * @param {object} document - glTF 文档对象
 * @param {string} inputPath - 输入文件路径
 * @param {string} outputDir - 输出目录
 * @param {string} relativePath - 相对路径
 * @param {object} userConfig - 用户配置
 * @returns {Promise<Array>} 输出的文件路径数组
 */
export async function writeModelWithConfig(io, document, inputPath, outputDir, relativePath, userConfig = {}) {
  const config = mergeOutputConfig(userConfig);
  const outputPaths = [];
  
  // 确定要输出的格式
  let formatsToOutput = [];
  
  switch (config.format) {
    case 'glb':
      formatsToOutput = ['glb'];
      break;
    case 'gltf':
      formatsToOutput = ['gltf'];
      break;
    case 'both':
      formatsToOutput = ['glb', 'gltf'];
      break;
    case 'preserve':
    default:
      const defaultFormat = getDefaultFormat(inputPath);
      formatsToOutput = [defaultFormat];
      break;
  }
  
  // 输出每种格式
  for (const format of formatsToOutput) {
    const outputPath = generateOutputPath(inputPath, outputDir, relativePath, format, config);
    
    try {
      await writeModelFile(io, document, outputPath, format, config);
      outputPaths.push(outputPath);
    } catch (error) {
      console.error(`输出 ${format} 格式失败:`, error.message);
      // 继续处理其他格式，不中断整个流程
    }
  }
  
  return outputPaths;
}

/**
 * 解析命令行参数中的输出配置
 * @param {Array} args - 命令行参数数组
 * @returns {object} 解析出的配置对象
 */
export function parseOutputConfigFromArgs(args) {
  const config = {};
  
  // 解析 --format 参数
  const formatIndex = args.findIndex(arg => arg === '--format' || arg === '-f');
  if (formatIndex !== -1 && formatIndex + 1 < args.length) {
    config.format = args[formatIndex + 1];
  }
  
  // 解析 --both 参数
  if (args.includes('--both') || args.includes('-b')) {
    config.format = 'both';
  }
  
  // 解析 --naming 参数
  const namingIndex = args.findIndex(arg => arg === '--naming' || arg === '-n');
  if (namingIndex !== -1 && namingIndex + 1 < args.length) {
    config.naming = args[namingIndex + 1];
  }
  
  // 解析 --directory 参数
  const directoryIndex = args.findIndex(arg => arg === '--directory' || arg === '-d');
  if (directoryIndex !== -1 && directoryIndex + 1 < args.length) {
    config.directory = args[directoryIndex + 1];
  }
  
  // 解析 --no-overwrite 参数
  if (args.includes('--no-overwrite')) {
    config.overwrite = false;
  }
  
  return config;
}

/**
 * 显示输出配置信息
 * @param {object} config - 配置对象
 */
export function displayOutputConfig(config) {
  console.log('\n📁 输出配置:');
  console.log(`   格式: ${config.format}`);
  console.log(`   命名: ${config.naming}`);
  console.log(`   目录: ${config.directory}`);
  console.log(`   覆盖: ${config.overwrite ? '是' : '否'}`);
  
  if (config.format === 'glb') {
    console.log(`   GLB: ${outputConfig.glb.description}`);
  } else if (config.format === 'gltf') {
    console.log(`   GLTF: ${outputConfig.gltf.description}`);
  } else if (config.format === 'both') {
    console.log(`   GLB: ${outputConfig.glb.description}`);
    console.log(`   GLTF: ${outputConfig.gltf.description}`);
  }
  console.log();
} 