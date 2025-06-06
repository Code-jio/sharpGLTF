# 输出格式配置指南

## 概述

本工具支持灵活的输出格式配置，可以将优化后的模型输出为 GLB、GLTF 或同时输出两种格式。支持自定义文件命名策略和目录结构组织。

## 支持的输出格式

### GLB 格式
- **特点**: 二进制格式，单一文件
- **优势**: 文件体积小，加载速度快，适合生产环境
- **适用场景**: Web应用、移动应用、游戏引擎

### GLTF 格式
- **特点**: 文本格式，多文件结构
- **优势**: 可读性强，便于调试和修改
- **适用场景**: 开发调试、资源编辑、工具链集成

## 基本用法

### 命令行参数

```bash
# 基本用法
node main.js                          # 保持原格式
node main.js --format glb             # 只输出GLB格式
node main.js --format gltf            # 只输出GLTF格式
node main.js --format both            # 同时输出两种格式
node main.js --format preserve        # 保持原格式(默认)

# 结合LOD生成
node main.js --lod --format glb       # 生成LOD + GLB格式
node main.js --lod --format both      # 生成LOD + 两种格式
```

### 文件命名策略

```bash
# 命名选项
node main.js --naming preserve        # 保持原文件名(默认)
node main.js --naming suffix          # 添加格式后缀
node main.js --naming custom          # 使用自定义命名

# 示例输出：
# preserve: model.glb, model.gltf
# suffix:   model_glb.glb, model_gltf.gltf  
# custom:   model_optimized.glb, model_optimized.gltf
```

### 目录结构策略

```bash
# 目录组织
node main.js --directory mixed        # 混合存放(默认)
node main.js --directory separate     # 按格式分目录

# mixed 输出结构:
# export/
# ├── model1.glb
# ├── model1.gltf
# └── subfolder/
#     ├── model2.glb
#     └── model2.gltf

# separate 输出结构:
# export/
# ├── glb/
# │   ├── model1.glb
# │   └── subfolder/model2.glb
# └── gltf/
#     ├── model1.gltf
#     └── subfolder/model2.gltf
```

## 高级配置

### 组合使用示例

```bash
# 同时输出两种格式，添加后缀，按格式分目录
node main.js --format both --naming suffix --directory separate

# LOD + 自定义命名 + GLB格式
node main.js --lod --format glb --naming custom

# 不覆盖已存在文件 + GLTF格式
node main.js --format gltf --no-overwrite
```

### 配置文件自定义

编辑 `config/output-config.js` 来修改默认行为：

```javascript
export const outputConfig = {
  default: {
    format: 'glb',           // 修改默认输出格式
    naming: 'suffix',        // 修改默认命名策略
    directory: 'separate',   // 修改默认目录策略
    overwrite: false,        // 修改覆盖行为
  },
  
  // 格式特定设置
  glb: {
    binary: true,            // GLB二进制压缩
    embedTextures: true,     // 嵌入纹理
  },
  
  gltf: {
    pretty: true,            // 格式化JSON
    embedImages: false,      // 不嵌入图片
    separateResources: true, // 分离资源文件
  }
}
```

## 输出示例

### 单一格式输出

```bash
$ node main.js --format glb

🚀 启动 glTF 模型优化器

📁 输出配置:
   格式: glb
   命名: preserve
   目录: mixed
   覆盖: 是
   GLB: Binary glTF format - 单一二进制文件，适合生产环境

[1/3] 正在处理: ./model/building.gltf
✓ GLB 已保存: export/building.glb (1024.50 KB)
✓ 完成处理，输出 1 个文件
```

### 多格式输出

```bash
$ node main.js --format both --naming suffix

🚀 启动 glTF 模型优化器

📁 输出配置:
   格式: both
   命名: suffix
   目录: mixed
   覆盖: 是
   GLB: Binary glTF format - 单一二进制文件，适合生产环境
   GLTF: Text-based glTF format - 多文件格式，便于调试和修改

[1/2] 正在处理: ./model/car.glb
✓ GLB 已保存: export/car_glb.glb (512.30 KB)
✓ GLTF 已保存: export/car_gltf.gltf (1.20 MB)
✓ 完成处理，输出 2 个文件
```

### 分目录输出

```bash
$ node main.js --format both --directory separate

输出结构:
export/
├── glb/
│   ├── model1.glb
│   ├── model2.glb
│   └── vehicles/
│       └── car.glb
└── gltf/
    ├── model1.gltf
    ├── model1.bin
    ├── model2.gltf
    ├── model2.bin
    └── vehicles/
        ├── car.gltf
        └── car.bin
```

## 格式特性对比

| 特性 | GLB | GLTF |
|------|-----|------|
| 文件结构 | 单一二进制文件 | 多文件（JSON + 资源） |
| 文件大小 | 较小 | 较大 |
| 加载速度 | 快 | 相对慢 |
| 可读性 | 不可读 | 高可读性 |
| 调试友好 | 较难 | 容易 |
| 网络传输 | 优秀 | 需要多个请求 |
| 适用场景 | 生产环境 | 开发调试 |

## 最佳实践

### 生产环境推荐

```bash
# 生产环境：GLB格式，保持文件名简洁
node main.js --format glb --naming preserve

# 多平台部署：同时提供两种格式
node main.js --format both --directory separate
```

### 开发环境推荐

```bash
# 开发调试：GLTF格式，便于检查
node main.js --format gltf --naming suffix

# 版本管理：自定义命名，避免覆盖
node main.js --format gltf --naming custom --no-overwrite
```

### 批量处理推荐

```bash
# 大量文件：分目录组织，避免混乱
node main.js --format both --directory separate --naming suffix

# 增量更新：不覆盖已存在文件
node main.js --format glb --no-overwrite
```

## 常见问题

### Q: 如何选择输出格式？
A: 
- **GLB**: 适合最终发布，文件小，加载快
- **GLTF**: 适合开发阶段，便于调试和修改
- **Both**: 兼顾开发和生产需求

### Q: 文件命名冲突怎么办？
A: 使用 `--naming suffix` 或 `--naming custom` 避免命名冲突，或使用 `--directory separate` 按格式分目录存放。

### Q: 如何批量转换大量文件？
A: 使用 `--directory separate` 按格式组织，`--naming suffix` 区分格式，`--no-overwrite` 避免重复处理。

### Q: 输出文件太大怎么办？
A: GLB格式通常比GLTF格式小30-50%，建议生产环境使用GLB格式。

### Q: 如何验证输出质量？
A: GLTF格式便于人工检查，可以先输出GLTF验证效果，确认无误后再输出GLB用于生产。 