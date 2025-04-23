import fs from 'fs';
import path from 'path';

/**
 * 递归遍历目录结构
 * @param {string} dir 起始目录路径
 * @returns {Array<{path: string, isDirectory: boolean}>} 文件列表
 */
export function walkDirectory(dir) {
  const results = [];
  
  function walk(currentDir) {
    const files = fs.readdirSync(currentDir);
    
    for (const file of files) {
      const filePath = path.join(currentDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        results.push({ path: filePath, isDirectory: true });
        walk(filePath);
      } else {
        results.push({ path: filePath, isDirectory: false });
      }
    }
  }
  
  walk(dir);
  return results;
}

/**
 * 确保目录存在（递归创建）
 * @param {string} dirPath 目标目录路径
 */
export function ensureDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 构建相对路径
 * @param {string} baseDir 基准目录
 * @param {string} fullPath 完整文件路径
 * @returns {string} 相对路径
 */
export function getRelativePath(baseDir, fullPath) {
  return path.relative(baseDir, path.dirname(fullPath));
}