import { generateTangents } from "mikktspace";
import { resample as resampleWASM } from "keyframe-resample";
import {
  resample, // 重采样
  prune, // 删除未使用的节点、纹理或其他数据
  dedup, // 去重
  draco, // 压缩
  palette, // 减少颜色数量 减少文件大小
  reorder, // 重排序
  simplify, // 简化
  weld, // 合并顶点
  unweld,
  tangents, // 生成切线
  textureCompress, // 纹理压缩
  instance, // 实例化 
  vertexColorSpace, // 色彩空间校正
  partition, // 分块
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { PropertyType } from "@gltf-transform/core";
// import { createTextureCompressConfig } from "./utils/texture-utils.js";
// import { KTXSTextureFormat } from "@gltf-transform/extensions";

export async function optimizePipeline(document) {
  await document.transform(
    palette({ min: 5 }), // 减少颜色数量 减少文件大小
    vertexColorSpace({ inputColorSpace: "srgb" }), // 色彩空间校正
    resample({ ready: true, resample: resampleWASM }), // 无损重采样动画帧
    prune(), // 删除未使用的节点、纹理或其他数据
    dedup({
      propertyTypes: [
        PropertyType.ACCESSOR,
        PropertyType.MESH,
        PropertyType.TEXTURE,
        PropertyType.MATERIAL,
        PropertyType.SKIN,
      ],
    }), // 去重
    instance({ min: 2 }), // 实例化
    // draco({ compressionLevel: 10 }), // 启用draco压缩
    // textureCompress(createTextureCompressConfig({
    //   targetFormat: "webp",
    //   enableResize: true,
    //   logProgress: true
    // })), // 启用动态纹理分辨率调整（2的n次方）
    textureCompress({
      targetFormat: "webp",
      resize: [1024, 1024],
      quality: 80,
    }), // 启用动态纹理分辨率调整（2的n次方）
    simplify({
      simplifier: MeshoptSimplifier,
      ratio: 0.75, // 简化比例 0.75
      error: 0.001, // 简化误差 0.001
      filter: (primitive) => primitive.getPointCount() > 100,
    }),
    reorder({ encoder: MeshoptEncoder, level: "high" }), // 重排序
    weld({ tolerance: 0.001, toleranceNormal: 0.25 }),
    partition({ meshes: true, minSize: 2 }), // 启用分块功能
    unweld(),
    tangents({ generateTangents }), // 生成切线
    weld({
      tolerance: 0.00001,
      toleranceNormal: 0.1,
      onComplete: (stats) => {
        console.log(
          `合并 ${stats.original} 顶点数到 ${stats.merged} 顶点数.`, // 输出合并后的顶点数量
          stats
        );
      },
    }), // 重排序后再次合并
    weld({
      tolerance: 0.000001,
      overwrite: true,
      reportStatistics: console.log,
    }) // 最终顶点合并验证
  );
  console.log("顶点合并验证通过");
}
