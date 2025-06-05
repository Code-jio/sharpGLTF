/**
 * 纹理处理工具函数
 */
import { textureConfig, getTextureStrategy, isOptimalSize } from '../config/texture-config.js';

/**
 * 计算最接近的2的n次方数值
 * @param {number} value - 输入数值
 * @param {boolean} roundUp - 是否向上取整，默认false（就近取整）
 * @returns {number} 最接近的2的n次方数值
 */
export function calculatePowerOfTwo(value, roundUp = false) {
  if (value <= 0) return 1;
  
  const log2 = Math.log2(value);
  
  if (roundUp) {
    return Math.pow(2, Math.ceil(log2));
  } else {
    // 就近取整：比较向上和向下的距离
    const lower = Math.pow(2, Math.floor(log2));
    const upper = Math.pow(2, Math.ceil(log2));
    
    return (value - lower) <= (upper - value) ? lower : upper;
  }
}

/**
 * 根据原始纹理尺寸计算最佳2的n次方尺寸
 * @param {number} originalWidth - 原始宽度
 * @param {number} originalHeight - 原始高度
 * @param {object} options - 配置选项
 * @returns {[number, number]} 优化后的[宽度, 高度]
 */
export function getOptimalTextureSize(originalWidth, originalHeight, options = {}) {
  const {
    maxSize = textureConfig.global.maxSize,
    minSize = textureConfig.global.minSize,
    preserveAspectRatio = textureConfig.global.preserveAspectRatio,
    roundUp = false
  } = options;

  let newWidth = calculatePowerOfTwo(originalWidth, roundUp);
  let newHeight = calculatePowerOfTwo(originalHeight, roundUp);

  // 应用尺寸限制
  newWidth = Math.max(minSize, Math.min(maxSize, newWidth));
  newHeight = Math.max(minSize, Math.min(maxSize, newHeight));

  // 如果需要保持宽高比，使用较小的尺寸作为两个维度的值
  if (preserveAspectRatio && newWidth !== newHeight) {
    const size = Math.min(newWidth, newHeight);
    newWidth = size;
    newHeight = size;
  }

  return [newWidth, newHeight];
}

/**
 * 根据纹理类型获取推荐的分辨率策略（使用新的配置系统）
 * @param {string} textureName - 纹理名称
 * @param {number} originalWidth - 原始宽度
 * @param {number} originalHeight - 原始高度
 * @returns {[number, number]} 推荐的[宽度, 高度]
 */
export function getTextureStrategySize(textureName, originalWidth, originalHeight) {
  const strategy = getTextureStrategy(textureName);
  
  // 检查是否需要跳过处理
  if (originalWidth < textureConfig.performance.skipResizeThreshold && 
      originalHeight < textureConfig.performance.skipResizeThreshold) {
    return [originalWidth, originalHeight];
  }
  
  // 检查是否已经是最优尺寸
  if (isOptimalSize(originalWidth, originalHeight, strategy)) {
    return [originalWidth, originalHeight];
  }
  
  // 计算最优尺寸
  return getOptimalTextureSize(originalWidth, originalHeight, {
    maxSize: strategy.maxSize,
    minSize: strategy.minSize,
    roundUp: strategy.roundUp,
    preserveAspectRatio: textureConfig.global.preserveAspectRatio
  });
}

/**
 * 获取纹理处理统计信息
 * @param {string} textureName - 纹理名称
 * @param {number} originalWidth - 原始宽度
 * @param {number} originalHeight - 原始高度
 * @param {number} newWidth - 新宽度
 * @param {number} newHeight - 新高度
 * @returns {object} 统计信息
 */
function getProcessingStats(textureName, originalWidth, originalHeight, newWidth, newHeight) {
  const strategy = getTextureStrategy(textureName);
  const originalSize = originalWidth * originalHeight;
  const newSize = newWidth * newHeight;
  const reductionRatio = ((originalSize - newSize) / originalSize * 100).toFixed(1);
  
  return {
    textureName,
    strategy: strategy.keywords ? strategy.keywords[0] : 'default',
    originalDimensions: `${originalWidth}x${originalHeight}`,
    newDimensions: `${newWidth}x${newHeight}`,
    pixelReduction: `${reductionRatio}%`,
    wasOptimal: originalWidth === newWidth && originalHeight === newHeight
  };
}

/**
 * 创建纹理压缩配置，支持动态分辨率调整
 * @param {object} options - 配置选项
 * @returns {object} textureCompress配置对象
 */
export function createTextureCompressConfig(options = {}) {
  const {
    targetFormat = textureConfig.global.targetFormat,
    enableResize = true,
    logProgress = textureConfig.global.logProgress
  } = options;

  const config = {
    targetFormat,
    ...(enableResize && {
      resize: (texture) => {
        try {
          // 获取纹理的原始尺寸
          const image = texture.getImage();
          if (!image) {
            console.warn('无法获取纹理图像信息，使用默认尺寸');
            return [512, 512];
          }

          const originalWidth = image.width || 512;
          const originalHeight = image.height || 512;
          const textureName = texture.getName() || texture.getURI() || '';

          // 计算最优尺寸
          const [newWidth, newHeight] = getTextureStrategySize(
            textureName, 
            originalWidth, 
            originalHeight
          );

          if (logProgress) {
            const stats = getProcessingStats(textureName, originalWidth, originalHeight, newWidth, newHeight);
            
            if (stats.wasOptimal) {
              console.log(`✓ 纹理 "${textureName}" 已是最优尺寸，保持 ${stats.originalDimensions}`);
            } else {
              console.log(`→ 纹理 "${textureName}" [${stats.strategy}] ${stats.originalDimensions} -> ${stats.newDimensions} (减少 ${stats.pixelReduction})`);
            }
          }

          return [newWidth, newHeight];
        } catch (error) {
          console.error('纹理分辨率计算出错:', error);
          return [512, 512]; // 回退到默认尺寸
        }
      }
    })
  };

  return config;
}

/**
 * 批量分析纹理尺寸分布（用于调试和优化）
 * @param {Array} textures - 纹理数组
 * @returns {object} 分析报告
 */
export function analyzeTextureDistribution(textures) {
  const analysis = {
    total: textures.length,
    byStrategy: {},
    sizeBuckets: {},
    summary: {
      totalPixelReduction: 0,
      averageReduction: 0,
      optimalCount: 0
    }
  };

  textures.forEach(texture => {
    const { textureName, originalWidth, originalHeight } = texture;
    const strategy = getTextureStrategy(textureName);
    const [newWidth, newHeight] = getTextureStrategySize(textureName, originalWidth, originalHeight);
    
    // 统计策略分布
    const strategyName = strategy.keywords ? strategy.keywords[0] : 'default';
    if (!analysis.byStrategy[strategyName]) {
      analysis.byStrategy[strategyName] = 0;
    }
    analysis.byStrategy[strategyName]++;
    
    // 统计尺寸分布
    const sizeBucket = `${newWidth}x${newHeight}`;
    if (!analysis.sizeBuckets[sizeBucket]) {
      analysis.sizeBuckets[sizeBucket] = 0;
    }
    analysis.sizeBuckets[sizeBucket]++;
    
    // 计算优化效果
    const originalSize = originalWidth * originalHeight;
    const newSize = newWidth * newHeight;
    const reduction = (originalSize - newSize) / originalSize;
    
    analysis.summary.totalPixelReduction += reduction;
    if (originalWidth === newWidth && originalHeight === newHeight) {
      analysis.summary.optimalCount++;
    }
  });
  
  analysis.summary.averageReduction = (analysis.summary.totalPixelReduction / textures.length * 100).toFixed(1);
  
  return analysis;
} 