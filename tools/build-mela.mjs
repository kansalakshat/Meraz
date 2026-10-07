// Cuts the events page's carnival down for the web: Main_Events_Model.glb (265 MB, 2.6 M triangles, 107 MB of
// textures) becomes public/models/mela.glb (~9 MB). Nothing here is part of the Next build; run it by hand whenever
// the source model changes, then bump melaModel's ?v= in data/site.ts so visitors do not keep the old one.
//
//   npm i --no-save @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer sharp
//   node --max-old-space-size=12288 tools/build-mela.mjs Main_Events_Model.glb public/models/mela.glb
//
// What it does, and why:
//  - dedup + prune: the model carries the same stall, tree and prop meshes many times over, and textures twice.
//  - weld: joins vertices the exporter split, so the simplifier has something to collapse.
//  - drop: the food laid out on the yatai counters (DROP), which sat in front of the pages hung behind them; and
//    every mesh the camera never sees on its walk (mela-unseen.json: rendered from ~700 frames along the scroll
//    route, landscape and portrait, each mesh in its own colour; re-measure if the route or the model changes).
//  - simplify, per mesh: everything goes as far as its error budget allows, except the ground. The ground is one big rolling
//    surface: cut as hard as the rest, it folds into dark shards under the night light, so it gets a far tighter
//    error budget (GROUND) with its borders locked, which keeps its shape and still sheds most of its triangles.
//  - background (FAR): meshes only ever seen far off are simplified much harder, and their textures shrunk.
//  - textureCompress: 146 textures to WebP, capped at CAP px. This is the single biggest win (107 MB -> 2 MB).
//  - meshopt: quantises and entropy-codes what is left. The page's GLTFLoader already has the matching decoder.
//
// Node names and all four animations survive, which matters: EventsStreet.tsx finds the giant wheel, the
// merry-go-round, the fairgoers, the lanterns and the stall signs by name.
import { NodeIO, getBounds } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, weld, simplifyPrimitive, compactPrimitive, textureCompress, meshopt, getSceneVertexCount, VertexCountMethod } from "@gltf-transform/functions";
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from "meshoptimizer";
import sharp from "sharp";
import { readFileSync, statSync } from "node:fs";

const [IN, OUT] = process.argv.slice(2);
if (!IN || !OUT) throw new Error("usage: build-mela.mjs <in.glb> <out.glb>");
const RATIO = 0.04; // triangles kept, at least: the error budget is what stops the simplifier
const ERROR = 0.03; // how far a simplified surface may stray, as a share of the mesh's size
const GROUND = { ratio: 0.2, error: 0.0015 }; // the same, for the ground
const DROP = /^(chocobanana|yakitoridai|marutako|takoyakidai|Pot|potato)\b/; // the counters' food, at every stall
const UNSEEN = new Set(JSON.parse(readFileSync(new URL("mela-unseen.json", import.meta.url), "utf8")));
// Background: a mesh none of whose copies comes within dist of his walk (the alley, x0 … x1 along z = 0, in the
// model's units) is only ever seen small and far off, so it is cut much harder and its own textures shrink to cap px.
// Its triangles are collapsed without regard to its seams (meshopt's sloppy simplifier): the careful one stops at every
// UV and normal seam, and these meshes are all seams.
const FAR = { dist: 1, ratio: 0.2, error: 0.05, cap: 128, x0: -2.4, x1: 0.8 };
const CAP = 384; // longest side of any texture, px
const MB = (n) => (n / 1048576).toFixed(1) + " MB";

await Promise.all([MeshoptSimplifier.ready, MeshoptEncoder.ready, MeshoptDecoder.ready]);
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ "meshopt.encoder": MeshoptEncoder, "meshopt.decoder": MeshoptDecoder });

const doc = await io.read(IN);
const root = doc.getRoot();
const scene = root.getDefaultScene() ?? root.listScenes()[0];
const verts = () => getSceneVertexCount(scene, VertexCountMethod.RENDER);
console.log(`in:  ${MB(statSync(IN).size)}  verts ${verts().toLocaleString()}  meshes ${root.listMeshes().length}  textures ${root.listTextures().length}`);

const dropped = root.listNodes().filter((n) => DROP.test(n.getName()));
for (const n of dropped) n.dispose();
const unseen = root.listNodes().filter((n) => n.getMesh() && UNSEEN.has(n.getName()));
for (const n of unseen) n.setMesh(null).setSkin(null);
console.log(`dropped ${dropped.length} nodes of counter food, ${unseen.length} meshes never seen`);
await doc.transform(dedup(), prune({ keepLeaves: false, keepAttributes: false, keepIndices: false, keepSolidTextures: false }), weld());

// Every mesh under the node called "ground" keeps all of its detail; see the note above.
const spared = new Set();
const mark = (node, under) => {
  const mine = under || node.getName() === "ground";
  if (mine && node.getMesh()) spared.add(node.getMesh());
  for (const child of node.listChildren()) mark(child, mine);
};
for (const n of scene.listChildren()) mark(n, false);

const away = (node) => {
  const { min, max } = getBounds(node);
  return Math.hypot(Math.max(FAR.x0 - max[0], 0, min[0] - FAR.x1), Math.max(min[2], 0, -max[2]));
};
const far = new Set(
  root.listMeshes().filter((mesh) => {
    const users = mesh.listParents().filter((p) => p.propertyType === "Node");
    return !spared.has(mesh) && users.length && users.every((n) => !n.getSkin() && away(n) > FAR.dist);
  }),
);
const textures = (meshes) =>
  new Set(
    [...meshes].flatMap((mesh) =>
      mesh.listPrimitives().flatMap((p) => {
        const m = p.getMaterial();
        return m ? [m.getBaseColorTexture(), m.getEmissiveTexture(), m.getNormalTexture(), m.getMetallicRoughnessTexture(), m.getOcclusionTexture()] : [];
      }),
    ),
  );
const nearTex = textures(root.listMeshes().filter((m) => !far.has(m)));
const farTex = [...textures(far)].filter((t) => t && !nearTex.has(t));
for (const t of farTex) t.setImage(await sharp(t.getImage()).resize(FAR.cap, FAR.cap, { fit: "inside", withoutEnlargement: true }).png().toBuffer()).setMimeType("image/png");

let cut = 0;
for (const mesh of root.listMeshes()) {
  const ground = spared.has(mesh);
  for (const prim of mesh.listPrimitives()) {
    const idx = prim.getIndices();
    const pos = prim.getAttribute("POSITION");
    if (far.has(mesh) && idx && pos.getArray() instanceof Float32Array) {
      const target = Math.floor((idx.getCount() * FAR.ratio) / 3) * 3;
      const [kept] = MeshoptSimplifier.simplifySloppy(Uint32Array.from(idx.getArray()), pos.getArray(), 3, null, target, FAR.error);
      if (kept.length >= 3) {
        // a fresh accessor: dedup may have shared the old one with other primitives
        prim.setIndices(doc.createAccessor().setType("SCALAR").setBuffer(idx.getBuffer()).setArray(pos.getCount() > 65535 ? kept : Uint16Array.from(kept)));
        compactPrimitive(prim);
      }
    } else simplifyPrimitive(prim, { simplifier: MeshoptSimplifier, ...(ground ? { ...GROUND, lockBorder: true } : { ratio: RATIO, error: ERROR, lockBorder: false }) });
    cut++;
  }
}
await doc.transform(prune({ keepLeaves: false, keepSolidTextures: false }));
console.log(`simplified ${cut} primitives (${spared.size} of them ground, cut gently; ${far.size} meshes and ${farTex.length} textures far off, cut hard) -> verts ${verts().toLocaleString()}`);

await doc.transform(
  textureCompress({ encoder: sharp, targetFormat: "webp", resize: [CAP, CAP], quality: 65, effort: 6 }),
  dedup(),
  meshopt({ encoder: MeshoptEncoder, level: "high", quantizePosition: 11, quantizeNormal: 8, quantizeTexcoord: 10, quantizeGeneric: 10 }),
);
await io.write(OUT, doc);
console.log(`out: ${MB(statSync(OUT).size)}  animations ${root.listAnimations().map((a) => a.getName()).join(", ")}`);
