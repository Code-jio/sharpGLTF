/**
 * 输出配置文件
 * 管理模型文件的输出格式和相关设置
 */

export const outputConfig = {
  // 默认输出格式设置
  default: {
    format: 'preserve',        // 'glb', 'gltf', 'both', 'preserve' (保持原格式)
    naming: 'preserve',        // 'preserve', 'suffix', 'custom'
    directory: 'mixed',        // 'mixed', 'separate' (按格式分目录)
    overwrite: true,           // 是否覆盖已存在的文件
  },

  // GLB格式特定设置
  glb: {
    extension: '.glb',
    binary: true,              // 启用二进制压缩
    embedTextures: true,       // 嵌入纹理到GLB文件中
    description: 'Binary glTF format - 单一二进制文件，适合生产环境'
  },

  // GLTF格式特定设置
  gltf: {
    extension: '.gltf',
    pretty: true,              // 格式化JSON，便于阅读
    embedImages: false,        // 是否嵌入图片到GLTF文件中
    separateResources: true,   // 将资源分离到单独文件
    description: 'Text-based glTF format - 多文件格式，便于调试和修改'
  },

  // 文件命名策略
  naming: {
    preserve: {
      description: '保持原始文件名',
      pattern: '{name}{ext}'
    },
    suffix: {
      description: '添加格式后缀',
      pattern: '{name}_{format}{ext}'
    },
    custom: {
      description: '自定义命名模式',
      pattern: '{name}_optimized{ext}'
    }
  },

  // 目录结构策略
  directory: {
    mixed: {
      description: '所有格式混合在同一目录',
      pattern: '{outputDir}/{relativePath}'
    },
    separate: {
      description: '按格式分别存放到不同目录',
      pattern: '{outputDir}/{format}/{relativePath}'
    }
  },

  // 格式验证规则
  validation: {
    supportedFormats: ['glb', 'gltf', 'both', 'preserve'],
    supportedNaming: ['preserve', 'suffix', 'custom'],
    supportedDirectory: ['mixed', 'separate']
  }
};

/**
 * 根据输入格式获取默认输出格式
 * @param {string} inputPath - 输入文件路径
 * @returns {string} 默认输出格式
 */
export function getDefaultFormat(inputPath) {
  const ext = inputPath.toLowerCase().split('.').pop();
  return ext === 'glb' ? 'glb' : 'gltf';
}

/**
 * 验证输出配置的有效性
 * @param {object} config - 配置对象
 * @returns {boolean} 是否有效
 */
export function validateOutputConfig(config) {
  const { validation } = outputConfig;
  
  if (config.format && !validation.supportedFormats.includes(config.format)) {
    throw new Error(`不支持的输出格式: ${config.format}，支持的格式: ${validation.supportedFormats.join(', ')}`);
  }
  
  if (config.naming && !validation.supportedNaming.includes(config.naming)) {
    throw new Error(`不支持的命名策略: ${config.naming}，支持的策略: ${validation.supportedNaming.join(', ')}`);
  }
  
  if (config.directory && !validation.supportedDirectory.includes(config.directory)) {
    throw new Error(`不支持的目录策略: ${config.directory}，支持的策略: ${validation.supportedDirectory.join(', ')}`);
  }
  
  return true;
}

/**
 * 合并用户配置和默认配置
 * @param {object} userConfig - 用户配置
 * @returns {object} 合并后的配置
 */
export function mergeOutputConfig(userConfig = {}) {
  validateOutputConfig(userConfig);
  
  return {
    ...outputConfig.default,
    ...userConfig
  };
} 