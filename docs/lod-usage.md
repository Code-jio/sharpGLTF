# LOD（多层次细节）功能使用指南

本文档介绍如何使用新增的LOD（Level of Detail，多层次细节）功能来优化模型加载和渲染性能。

## 概述

LOD技术通过根据模型距离摄像机的远近，自动切换不同精度的模型版本，从而提高渲染性能。当模型远离摄像机时，使用低精度版本；当模型靠近摄像机时，使用高精度版本。

## 命令行使用

在命令行中添加`--lod`或`-l`参数来开启LOD生成功能：

```bash
# 为所有模型生成LOD
node main.js --lod

# 或使用短参数
node main.js -l
```

## 输出文件

对于每个处理的模型文件，系统将生成以下文件：

1. 原始优化模型：`model.glb`
2. 不同LOD级别的模型：
   - `model_lod_1_0.glb` (原始精度 100%)
   - `model_lod_0_7.glb` (简化为原始模型的 70%)
   - `model_lod_0_4.glb` (简化为原始模型的 40%)
   - `model_lod_0_2.glb` (简化为原始模型的 20%)
   - `model_lod_0_1.glb` (简化为原始模型的 10%)
3. LOD配置文件：`model_lod_config.json`

注意：实际生成的LOD级别数量取决于模型的复杂度。复杂度越高，生成的LOD级别越多。

## LOD配置文件

配置文件包含以下信息：

```json
{
  "model": "model_name",
  "levels": [
    {
      "level": 1.0,
      "path": "model_name_lod_1_0.glb",
      "distanceThreshold": 100
    },
    {
      "level": 0.7,
      "path": "model_name_lod_0_7.glb",
      "distanceThreshold": 143
    },
    // 更多LOD级别...
  ]
}
```

每个级别包含：
- `level`: LOD级别 (0~1，1表示最高精度)
- `path`: 模型文件路径
- `distanceThreshold`: 距离阈值，当相机距离大于此值时，会使用此LOD或更低精度的LOD

## 在Web端使用LOD模型

我们提供了示例代码：`examples/lod-viewer.html`，展示如何在Three.js中加载和使用LOD模型。

基本使用流程：

1. 创建LOD管理器
```javascript
const lodManager = new ModelLODManager();
lodManager.setCamera(camera);
```

2. 加载LOD配置和模型
```javascript
await lodManager.loadModelLODs('path/to/model_lod_config.json');
lodManager.addToScene('modelId', scene);
```

3. 在动画循环中更新LOD
```javascript
function animate() {
  requestAnimationFrame(animate);
  
  // 更新LOD
  lodManager.update();
  
  renderer.render(scene, camera);
}
```

## 如何自定义LOD设置

如果需要自定义LOD级别，可以修改`utils/lod-generator.js`中的`calculateOptimalLODLevels`函数：

```javascript
function calculateOptimalLODLevels(document) {
  // 计算模型复杂度...
  
  // 根据模型复杂度计算LOD级别
  let levels = [1.0];
  
  if (totalVertices > 100000 || totalTriangles > 50000) {
    // 自定义LOD级别
    levels = [1.0, 0.7, 0.4, 0.2, 0.1];
  } 
  // 更多条件...
  
  return {
    levels: levels,
    complexity: {
      vertices: totalVertices,
      triangles: totalTriangles
    }
  };
}
```

也可以在代码中直接指定LOD级别：

```javascript
const customLevels = [1.0, 0.5, 0.1];
const lodModels = await generateLODs(document, customLevels);
```

## 性能调优建议

1. **平衡LOD级别数量**：
   - 更多的LOD级别会提供更平滑的过渡，但会占用更多存储空间
   - 推荐：复杂模型使用4-5个级别，简单模型使用2-3个级别

2. **优化距离阈值**：
   - 如果LOD切换很明显，尝试调整距离阈值使过渡更平滑
   - 可以在`calculateDistanceThreshold`函数中自定义阈值计算逻辑

3. **选择性应用**：
   - 不是所有模型都需要LOD，对于小型或简单的模型可以跳过LOD生成

4. **预处理与动态生成结合**：
   - 对于核心资产，使用预处理生成LOD
   - 对于动态加载的资产，可以考虑运行时生成LOD

## 故障排除

问题：LOD模型切换时出现明显的"跳变"
- 解决方案：考虑实现渐变过渡或调整距离阈值

问题：某些模型在低LOD级别下细节丢失严重
- 解决方案：增加简化比例或减小误差阈值

问题：生成LOD时内存使用过高
- 解决方案：尝试使用更大的简化步长，减少LOD级别数量 