// The home page's background models (the trees and the passers-by, only ever seen small at the roadside): their
// textures shrink to CAP px, in place. Run by hand after replacing any of them, then hard-refresh.
//
//   npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
//   node tools/shrink-background.mjs [models folder, default public/models]
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { textureCompress } from "@gltf-transform/functions";
import { MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";
import { statSync } from "node:fs";
import { fileURLToPath } from "node:url";

const MODELS = ["tree-2", "tree-3", "man", "oldman", "stall-keeper"]; // tree-1 and woman come out larger re-encoded
const CAP = 256;
const DIR = process.argv[2] ?? fileURLToPath(new URL("../public/models/", import.meta.url));

await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });
for (const name of MODELS) {
  const file = `${DIR}/${name}.glb`;
  const before = statSync(file).size;
  const doc = await io.read(file);
  await doc.transform(textureCompress({ encoder: sharp, targetFormat: "webp", resize: [CAP, CAP], quality: 60, effort: 6 }));
  await io.write(file, doc);
  console.log(name, before, "->", statSync(file).size);
}
