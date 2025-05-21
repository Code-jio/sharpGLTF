import path from 'path';
import fs from 'fs';
import { simplify } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

/**
 * 根据模型复杂度自动计算合适的LOD级别
 * @param {Object} document - gltf-transform Document对象
 * @returns {Object} 包含计算出的LOD级别和模型复杂度信息
 */
export function calculateOptimalLODLevels(document) {
  const meshes = document.getRoot().listMeshes();
  let totalVertices = 0;
  let totalTriangles = 0;
  
  // 计算模型总顶点数和三角形数
  meshes.forEach(mesh => {
    mesh.listPrimitives().forEach(primitive => {
      totalVertices += primitive.getAttribute('POSITION')?.getCount() || 0;
      
      // 计算三角形数量
      if (primitive.getMode() === 4) { // TRIANGLES
        const indices = primitive.getIndices();
        if (indices) {
          totalTriangles += indices.getCount() / 3;
        } else {
          totalTriangles += (primitive.getAttribute('POSITION')?.getCount() || 0) / 3;
        }
      }
    });
  });
  
  // 根据模型复杂度计算LOD级别
  let levels = [1.0];
  
  if (totalVertices > 100000 || totalTriangles > 50000) {
    // 非常复杂的模型：5个LOD级别
    levels = [1.0, 0.7, 0.4, 0.2, 0.1];
  } else if (totalVertices > 50000 || totalTriangles > 20000) {
    // 复杂模型：4个LOD级别
    levels = [1.0, 0.7, 0.4, 0.15];
  } else if (totalVertices > 10000 || totalTriangles > 5000) {
    // 中等复杂度：3个LOD级别
    levels = [1.0, 0.6, 0.2];
  } else if (totalVertices > 1000 || totalTriangles > 500) {
    // 简单模型：2个LOD级别
    levels = [1.0, 0.3];
  }
  
  return {
    levels: levels,
    complexity: {
      vertices: totalVertices,
      triangles: totalTriangles
    }
  };
}

/**
 * 计算LOD级别对应的距离阈值
 * @param {number} level - LOD级别 (0~1)
 * @returns {number} 距离阈值
 */
export function calculateDistanceThreshold(level) {
  // 简单公式：级别越低（简化越多），距离阈值越大
  return Math.round(100 / level);
}

/**
 * 为模型生成多个LOD级别
 * @param {Object} document - 经过标准优化的gltf-transform Document对象
 * @param {Array} levels - LOD级别数组，例如 [1.0, 0.7, 0.4, 0.2, 0.1]
 * @returns {Array} 包含所有LOD级别的文档对象数组
 */
export async function generateLODs(document, levels = null) {
  // 如果没有提供levels，则自动计算
  if (!levels) {
    const { levels: calculatedLevels } = calculateOptimalLODLevels(document);
    levels = calculatedLevels;
  }
  
  const documents = [];
  
  // 原始模型作为最高精度 (LOD0)
  documents.push({
    level: 1.0,
    document: document.clone()
  });
  
  // 生成不同级别的LOD
  for (let i = 1; i < levels.length; i++) {
    const level = levels[i];
    const lodDocument = document.clone();
    
    console.log(`正在生成LOD级别: ${level}`);
    
    // 简化几何体
    await lodDocument.transform(
      simplify({
        simplifier: MeshoptSimplifier,
        ratio: level,
        error: 0.001 * (1 / level), // 随着简化程度增加,允许更大的误差
        filter: (primitive) => primitive.getPointCount() > 100,
      })
    );
    
    documents.push({
      level: level,
      document: lodDocument
    });
    
    console.log(`LOD级别 ${level} 生成完成`);
  }
  
  return documents;
}

/**
 * 保存LOD模型和配置文件
 * @param {Array} lodModels - LOD模型数组
 * @param {Object} io - NodeIO实例
 * @param {string} outputBasePath - 输出文件基础路径
 * @param {string} modelName - 模型名称
 */
export async function saveLODModels(lodModels, io, outputBasePath, modelName) {
  const lodConfig = {
    model: modelName,
    levels: []
  };
  
  // 保存所有LOD级别
  for (const { level, document: lodDocument } of lodModels) {
    const levelStr = level.toString().replace(".", "_");
    const outputPath = `${outputBasePath}_lod_${levelStr}.glb`;
    const relativePath = `${modelName}_lod_${levelStr}.glb`;
    
    await io.write(outputPath, lodDocument);
    console.log(`LOD ${level} 已保存: ${outputPath}`);
    
    lodConfig.levels.push({
      level: level,
      path: relativePath,
      distanceThreshold: calculateDistanceThreshold(level)
    });
  }
  
  // 生成LOD配置文件
  const configPath = `${outputBasePath}_lod_config.json`;
  fs.writeFileSync(configPath, JSON.stringify(lodConfig, null, 2));
  console.log(`LOD配置文件已生成: ${configPath}`);
} 