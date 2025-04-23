import { generateTangents } from "mikktspace";
import { resample as resampleWASM } from "keyframe-resample";
import {
  resample,
  prune,
  dedup,
  draco,
  palette,
  reorder,
  simplify,
  weld,
  tangents,
  textureCompress,
  instance,
  vertexColorSpace,
  partition,
} from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptSimplifier } from "meshoptimizer";
import { PropertyType } from "@gltf-transform/core";
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
    instance({ min: 2 }), // 实例化  可以减少文件大小 但是会导致动画不流畅 暂时不启用
    draco({ compressionLevel: 7 }), // draco压缩
    textureCompress({
      // targetFormat: "ktx2",
      resize: [1024, 1024],
      // }).registerDependencies({
      //   'ktx-software': KTXSTextureFormat,
    }), // 启用KTX2压缩
    simplify({
      simplifier: MeshoptSimplifier, // 使用meshoptimizer简化
      ratio: 0.75, // 简化比例 0.75 表示简化75%的顶点
      error: 0.001, // 简化误差 0.001 表示简化误差小于0.001的顶点
      filter: (primitive) => primitive.getPointCount() > 100, // 过滤条件 只对顶点数量大于100的几何体进行简化
    }),
    reorder({ encoder: MeshoptEncoder, level: "high" }), // 重排序
    weld({ tolerance: 0.001, toleranceNormal: 0.25 }), // 调整顶点合并容差
    // partition({ meshes: true, minSize: 2 }), // 启用分块功能  // TODO： 该功能有问题
    weld({
      tolerance: 0.00001,
      toleranceNormal: 0.1,
      onComplete: (stats) => {
        console.log(
          `Welded ${stats.original} vertices to ${stats.merged} vertices.`, // 输出合并后的顶点数量
          stats
        );
      },
    }), // 重排序后再次合并
    weld({
      tolerance: 0.000001,
      overwrite: true,
      reportStatistics: console.log,
    }), // 最终顶点合并验证
    tangents({ generateTangents }) // 生成切线
  );
  console.log("顶点合并验证通过");
}
