import { NodeIO } from '@gltf-transform/core';
import { reorder, quantize } from '@gltf-transform/functions';
import { EXTMeshoptCompression } from '@gltf-transform/extensions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;

const io = new NodeIO()
.registerExtensions([EXTMeshoptCompression])
.registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
});

const document = await io.read('./model/shiwai-1/shiwai-1.gltf');

// Write and encode. (Medium, -c)
await document.transform(
    reorder({encoder: MeshoptEncoder}),
    quantize()
);
document.createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });
await io.write('./meshopt/medium/compressed-medium.gltf', document);

// Write and encode. (High, -cc)
await document.transform(
    reorder({encoder: MeshoptEncoder}),
    quantize({pattern: /^(POSITION|TEXCOORD|JOINTS|WEIGHTS)(_\d+)?$/}),
);
document.createExtension(EXTMeshoptCompression)
    .setRequired(true)
    .setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.FILTER });
await io.write('./meshopt/high/compressed-high.gltf', document);