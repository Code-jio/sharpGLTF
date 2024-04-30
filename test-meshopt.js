import { Document, NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";


import { simplify, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer"; // 网格优化


console.log(ALL_EXTENSIONS)

// import sharp from "sharp"; // 纹理压缩
// sharp的使用？
// https://sharp.pixelplumbing.com/api-output#jpeg

// Configure I/O.
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "draco3d.decoder": await draco3d.createDecoderModule(),
    "draco3d.encoder": await draco3d.createEncoderModule(),
  });

// Read from URL.
let document = await io.read("./gltf/scene.glb");


let ratio = 0; // 优化比例
let error = 0.001; // 误差

await document.transform(
  weld({ tolerance: 0.0001 }), // 顶点合并
  simplify({
    filter: (primitive) => {
      return primitive.getPointCount() > 100;
    }, // 100 个点以上的网格才进行优化
    simplifier: MeshoptSimplifier,
    error,
    ratio,
  }),

  // 纹理压缩
  textureCompress(
    {
      quality: 10, //  0-100 质量
      format: "astc", // "astc", "etc2", "pvrtc", "s3tc"
      mode: "lossy", // "lossy", "lossless"
    },
    {
      filter: (texture) => {
        return texture.getMimeType() === "image/jpeg";
      },
    }
  )
);
console.log("Done.");

// 写入模型文件 并以draco格式压缩
await io.write("./draco/output.drc", document, { dracoOptions: { compressionLevel: 10 } }); // 压缩等级 0-10
