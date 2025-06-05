# 纹理分辨率自动优化指南

## 概述

本工具实现了智能的纹理分辨率调整功能，能够自动将所有纹理贴图的分辨率调整至2的n次方倍（128、256、512、1024、2048等），同时根据纹理类型采用不同的优化策略。

## 主要特性

### ✅ 智能识别纹理类型
- **主纹理（Albedo/Diffuse）**: 保持较高分辨率（最高2048px）
- **法线贴图（Normal/Bump）**: 中等分辨率（最高1024px）
- **材质属性贴图（Roughness/Metallic/AO）**: 较低分辨率（最高1024px）
- **发光贴图（Emissive）**: 中等分辨率（最高1024px）
- **透明度贴图（Alpha）**: 中等分辨率（最高1024px）

### ✅ 智能优化策略
- 自动检测已经是2的n次方且在合理范围内的纹理，保持原始尺寸
- 小于128px的纹理跳过处理，避免过度优化
- 强制方形纹理以获得最佳GPU性能
- 支持向上取整（质量优先）或就近取整（文件大小优先）

### ✅ 详细的处理日志
```
✓ 纹理 "wall_albedo.jpg" 已是最优尺寸，保持 1024x1024
→ 纹理 "normal_map.jpg" [normal] 1500x1500 -> 1024x1024 (减少 53.3%)
→ 纹理 "roughness.jpg" [roughness] 300x300 -> 256x256 (减少 28.1%)
```

## 使用方法

### 基本使用
原来的固定配置：
```javascript
textureCompress({
  targetFormat: "webp",
  resize: [1024, 1024],  // 所有纹理强制为1024x1024
})
```

新的智能配置：
```javascript
import { createTextureCompressConfig } from "./utils/texture-utils.js";

textureCompress(createTextureCompressConfig({
  targetFormat: "webp",
  enableResize: true,
  logProgress: true
}))
```

### 自定义配置

#### 修改全局设置
编辑 `config/texture-config.js`：

```javascript
export const textureConfig = {
  global: {
    maxSize: 1024,        // 降低最大尺寸限制
    minSize: 256,         // 提高最小尺寸限制
    targetFormat: "jpg",  // 更改输出格式
    logProgress: false,   // 关闭详细日志
  }
}
```

#### 调整纹理类型策略
```javascript
strategies: {
  albedo: {
    keywords: ['albedo', 'diffuse', 'basecolor'],
    maxSize: 1024,        // 降低主纹理最大尺寸
    minSize: 512,         // 提高主纹理最小尺寸
    roundUp: false,       // 改为就近取整
  }
}
```

#### 性能优化设置
```javascript
performance: {
  skipResizeThreshold: 256,        // 256px以下的纹理跳过处理
  preserveOptimalSizes: false,    // 强制重新计算所有纹理
}
```

## 优化效果示例

### 处理前后对比

| 纹理名称 | 原始尺寸 | 优化后尺寸 | 策略 | 像素减少 |
|---------|----------|-----------|------|----------|
| wall_albedo.jpg | 1024×1024 | 1024×1024 | albedo | 0% (已优化) |
| wall_normal.jpg | 1500×1500 | 1024×1024 | normal | 53.3% |
| wall_roughness.jpg | 300×300 | 256×256 | material | 28.1% |
| metal_diffuse.jpg | 2048×2048 | 2048×2048 | albedo | 0% (保持高质量) |
| ao_texture.jpg | 800×600 | 512×512 | material | 46.1% |

### 批量处理统计
```
批量分析结果:
  总纹理数量: 15
  平均像素减少: 23.7%
  已优化纹理: 8/15
  策略分布: { albedo: 5, normal: 3, material: 6, default: 1 }
  尺寸分布: { '1024x1024': 8, '512x512': 4, '2048x2048': 2, '256x256': 1 }
```

## 工具函数说明

### `calculatePowerOfTwo(value, roundUp)`
计算最接近的2的n次方数值
```javascript
calculatePowerOfTwo(300);      // 返回 256 (就近取整)
calculatePowerOfTwo(300, true); // 返回 512 (向上取整)
```

### `getOptimalTextureSize(width, height, options)`
根据尺寸和配置计算最佳2的n次方尺寸
```javascript
getOptimalTextureSize(800, 600, {
  maxSize: 1024,
  minSize: 256,
  preserveAspectRatio: true  // 强制方形
}); // 返回 [512, 512]
```

### `getTextureStrategySize(name, width, height)`
根据纹理名称智能选择策略并计算尺寸
```javascript
getTextureStrategySize("wall_albedo.jpg", 1500, 1500); // 返回 [2048, 2048]
getTextureStrategySize("normal_map.jpg", 1500, 1500);  // 返回 [1024, 1024]
```

### `analyzeTextureDistribution(textures)`
批量分析纹理优化效果
```javascript
const analysis = analyzeTextureDistribution(textureArray);
console.log(`平均优化率: ${analysis.summary.averageReduction}%`);
```

## 最佳实践建议

### 1. 纹理命名规范
使用描述性的文件名以便自动识别策略：
- ✅ `wall_albedo.jpg`, `metal_diffuse.png`
- ✅ `surface_normal.jpg`, `bump_map.png`  
- ✅ `material_roughness.jpg`, `metallic_mask.png`
- ❌ `texture1.jpg`, `img_001.png`

### 2. 分辨率建议
- **主纹理**: 1024×1024 或 2048×2048
- **法线贴图**: 512×512 或 1024×1024
- **材质贴图**: 256×256 或 512×512
- **小细节贴图**: 128×128 或 256×256

### 3. 性能与质量平衡
- 对于移动端应用，建议降低 `maxSize` 至 1024
- 对于高品质渲染，可以提高 `minSize` 至 256
- 重要的主纹理可以设置 `roundUp: true` 保持质量

### 4. 批量处理工作流
1. 运行优化前先用 `analyzeTextureDistribution()` 分析当前状态
2. 根据分析结果调整配置参数
3. 批量处理后检查优化效果
4. 根据实际渲染效果微调策略

## 常见问题

### Q: 为什么有些纹理没有被调整？
A: 系统会自动跳过以下情况：
- 已经是2的n次方且在合理范围内的纹理
- 小于设定阈值（默认128px）的纹理
- 无法获取尺寸信息的纹理

### Q: 如何禁用某种类型纹理的处理？
A: 在配置中设置相应策略的 `maxSize` 为一个很大的值，或修改 `skipResizeThreshold`。

### Q: 是否支持非方形纹理？
A: 默认强制转换为方形以获得最佳GPU性能。可以通过设置 `preserveAspectRatio: false` 来保持原始宽高比。

### Q: 如何验证优化效果？
A: 使用 `analyzeTextureDistribution()` 函数分析优化前后的统计数据，或查看处理日志中的详细信息。 