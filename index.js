import { Document, NodeIO, PropertyType } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
import { MeshoptEncoder,MeshoptSimplifier } from "meshoptimizer";

import { generateTangents } from 'mikktspace';

// import { ready, resample as resampleWASM } from 'keyframe-resample';
import {
  resample,
  prune,
  dedup,
  draco,
  textureCompress,
  instance,
  flatten,
  reorder, 
  join,
  normals,
  dequantizePrimitive,
  dequantize,
  palette,
  partition,
  simplify,
  weld,
  sparse,
  tangents,
  vertexColorSpace,
} from "@gltf-transform/functions";
// import sharp from 'sharp'; // Node.js only.

// Configure I/O.
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

await MeshoptEncoder.ready; // 等待meshoptimizer加载完成


// Read from URL.
let document = await io.read("./gltf/factory.glb");

document.getRoot().listMaterials(); // 获取所有材质
document.getRoot().listBuffers(); // 获取所有缓冲区

await document.transform(
  palette({ min: 5 }), // 调色板 min: 5 最小颜色数量 减少颜色数量可以减少文件大小
  resample(), // 无损重采样动画帧。如果动画帧的数量过多，可以使用此函数减少动画帧的数量，减少文件大小
  prune(), // 删除未使用的节点、纹理或其他数据
  dedup({
    propertyTypes: [
      PropertyType.MESH,
      PropertyType.ACCESSOR,
      PropertyType.TEXTURE,
      PropertyType.MATERIAL,
    ],
  }), // 重复数据删除 mesh, accessor, texture, material
  weld({ tolerance: 0.0001, toleranceNormal: 0.25 }), // 顶点合并 tolerance: 0.0001 顶点合并容差 toleranceNormal: 0.5 法线合并容差
  // instance({min: 2}), // 实例化节点 min指的是最小实例化次数 （存疑：带有动画的节点不会被实例化）
  dequantize(
    { method: 'midpoint' }, // 解量化方法: 'midpoint', 'quantile', 'octree' 解量化方法越复杂，解量化后的模型越接近原始模型，但解量化时间也越长
  ), // 解量化
  flatten(), // 展平节点层次结构
  join({ keepNamed: false }), // 合并节点
  normals({overwrite: true}), // 重新计算法线 overwrite: true 会覆盖原有法线 重新计算法线可以修复法线方向错误的问题
  reorder({encoder: MeshoptEncoder, level: 'medium'}), // 重新排序顶点索引 level: 'low', 'medium', 'high' 重新排序顶点索引可以提高渲染性能
  // partition({meshes: true}), // 分区 meshes: true 会将每个网格分区为多个子网格，以便更好地利用GPU缓存  这一步会将bin文件拆分
  draco({ compressionLevel: 10 }), // 压缩等级 0-10 压缩等级越高，压缩率越高，但解压时间也越长
  vertexColorSpace({ inputColorSpace: 'srgb' }), // 顶点颜色空间校正 inputColorSpace: 'srgb', 'linear' 顶点颜色空间转换
  simplify({ simplifier: MeshoptSimplifier, ratio: 0.75, error: 0.001 }), // 网格简化 ratio: 0.75 简化75% error: 0.001 误差限制为 0.01%。这一步是有损的 参数越大，简化率越高，但是会丢失更多的细节
  tangents({generateTangents}), // 生成切线 会修复某些烘焙法线贴图出现的渲染问题
  textureCompress({ targetFormat: "webp", resize: [1024, 1024] }),// 纹理压缩
  backfaceCulling({ cull: true }), // 自定义背面剔除
  sparse({ratio: 1 / 10}), // 稀疏化 ratio: 1 / 10 每10个顶点中只有一个顶点会被保留，其他顶点会被丢弃
);

// KTX2 纹理压缩

document.getRoot().listMaterials(); // 获取所有材质
document.getRoot().listBuffers(); // 获取所有缓冲区

// 自定义背面剔除
function backfaceCulling(options) {
  return (document) => {
    for (const material of document.getRoot().listMaterials()) {
      material.setDoubleSided(!options.cull);
    }
  };
}

console.log("done");
// 写入
await io.write("./export/output.gltf", document);
