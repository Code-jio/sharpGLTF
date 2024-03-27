import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";

import { resample, prune, dedup, draco, textureCompress } from '@gltf-transform/functions';
// import sharp from 'sharp'; // Node.js only.


// Configure I/O.
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

// Read from URL.
let document = await io.read("./gltf/scene.glb");

await document.transform(
    // 无损重采样动画帧。
    resample(),
    // 删除未使用的节点、纹理或其他数据。
    prune(),
    // 移除重复的顶点或纹理数据
    dedup(),
    // 几何体压缩
    draco(),
    // // 纹理压缩
    // textureCompress({
    //     encoder: sharp,
    //     targetFormat: 'webp',
    //     resize: [1024, 2024],
    // }),
    // 自定义
    backfaceCulling({cull: true}),
);

// 自定义背面剔除
function backfaceCulling(options) {
    return (document) => {
        for (const material of document.getRoot().listMaterials()) {
            material.setDoubleSided(!options.cull);
        }
    };
}
console.log("done")
// 写入
await io.write("./export/output.gltf", document);