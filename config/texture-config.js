/**
 * 纹理处理配置文件
 * 可以根据需要调整不同类型纹理的处理策略
 */

export const textureConfig = {
  // 全局设置
  global: {
    maxSize: 2048,        // 全局最大纹理尺寸
    minSize: 128,         // 全局最小纹理尺寸
    targetFormat: "webp", // 目标格式
    logProgress: true,    // 是否记录处理日志
    preserveAspectRatio: true // 是否保持宽高比（强制正方形）
  },

  // 不同纹理类型的特定策略
  strategies: {
    // 主纹理（漫反射、反照率、基础颜色）
    albedo: {
      keywords: ['albedo', 'diffuse', 'basecolor', 'base_color', 'color'],
      maxSize: 2048,
      minSize: 256,
      roundUp: true,  // 向上取整，保持较高质量
      priority: 'high'
    },

    // 法线贴图
    normal: {
      keywords: ['normal', 'normalmap', 'normal_map', 'bump'],
      maxSize: 1024,
      minSize: 256,
      roundUp: false,
      priority: 'medium'
    },

    // 材质属性贴图（粗糙度、金属度、AO等）
    material: {
      keywords: ['roughness', 'metallic', 'metalness', 'ao', 'occlusion', 'ambient_occlusion'],
      maxSize: 1024,
      minSize: 128,
      roundUp: false,
      priority: 'low'
    },

    // 发光贴图
    emissive: {
      keywords: ['emissive', 'emission', 'glow'],
      maxSize: 1024,
      minSize: 256,
      roundUp: false,
      priority: 'medium'
    },

    // 透明度贴图
    alpha: {
      keywords: ['alpha', 'opacity', 'transparent'],
      maxSize: 1024,
      minSize: 256,
      roundUp: false,
      priority: 'medium'
    },

    // 默认策略（未分类的纹理）
    default: {
      maxSize: 1024,
      minSize: 256,
      roundUp: false,
      priority: 'medium'
    }
  },

  // 性能优化设置
  performance: {
    // 当原始纹理小于此尺寸时，不进行缩放
    skipResizeThreshold: 128,
    
    // 质量优化：当原始尺寸已经是2的n次方且在合理范围内时，保持原始尺寸
    preserveOptimalSizes: true,
    
    // 批量处理设置
    batchProcessing: {
      enabled: false,
      maxConcurrent: 4
    }
  }
};

/**
 * 根据纹理名称获取对应的处理策略
 * @param {string} textureName - 纹理名称
 * @returns {object} 纹理处理策略
 */
export function getTextureStrategy(textureName) {
  if (!textureName) return textureConfig.strategies.default;
  
  const name = textureName.toLowerCase();
  
  // 遍历所有策略，找到匹配的关键词
  for (const [strategyName, strategy] of Object.entries(textureConfig.strategies)) {
    if (strategyName === 'default') continue;
    
    if (strategy.keywords && strategy.keywords.some(keyword => name.includes(keyword))) {
      return strategy;
    }
  }
  
  return textureConfig.strategies.default;
}

/**
 * 检查纹理尺寸是否已经是最优的
 * @param {number} width - 纹理宽度
 * @param {number} height - 纹理高度
 * @param {object} strategy - 纹理策略
 * @returns {boolean} 是否已经是最优尺寸
 */
export function isOptimalSize(width, height, strategy) {
  if (!textureConfig.performance.preserveOptimalSizes) return false;
  
  const isPowerOfTwo = (n) => n > 0 && (n & (n - 1)) === 0;
  const isSquare = width === height;
  const isInRange = width >= strategy.minSize && width <= strategy.maxSize;
  
  return isPowerOfTwo(width) && isPowerOfTwo(height) && isSquare && isInRange;
} 