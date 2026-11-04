// AI selection (2.100.1, docs/ai-select-plan.md): SAM 2.1 Hiera Tiny (half precision) run by Transformers.js and ONNX Runtime Web, all of them files of the app's
// own (src/data/ai.js, in the hosted app only), loaded the first time AI is used and then kept by the browser. Nothing goes anywhere: the photo never leaves the page.
//   aiOk(files)                       true when this app has the AI files (the hosted app; the single file has none)
//   aiLoad(files, onProgress)         loads the runtime and the model once (onProgress(0..1) as the files arrive); a promise of the loaded model
//   aiPhoto(files, canvas)            analyses a picture once (the slow step: seconds); a promise of {W, H, masks(prompt)}, where
//     masks({points, box})            points [[x, y, add]] (pixels of the canvas; add 1 to include, 0 to leave out) and/or box [x0, y0, x1, y1]: a promise of
//                                     {masks: [Float32Array(W*H) x 3], scores: [3]}: three readings of the prompt, from a part to the whole, as logits (>0 is in)
// Rules: no work on import; the model is used one request at a time (the runtime runs them in order).
import {assetBytes,assetUrl} from './assets.js';
const AI_MODEL = 'sam2';   // the name the files are asked for by (wbai/sam2/<file>), answered from the app's own files
let aiLoaded = null;
const aiOk = files => !!(files && files.runtime && files.wasm && files.model);
// the graphics card, when it can run this model's half-precision numbers; else the processor
async function aiDevice() {
  try { if (navigator.gpu) { const a = await navigator.gpu.requestAdapter(); if (a && a.features && a.features.has('shader-f16')) return 'webgpu'; } } catch (e) {}
  return 'wasm';
}
function aiLoad(files, onProgress) {
  if (!aiOk(files)) return Promise.reject(new Error('AI is not in this copy of the app.'));
  if (aiLoaded) return aiLoaded;
  aiLoaded = (async () => {
    let got = 0; const tell = n => { got += n; if (onProgress) try { onProgress(Math.min(1, got / (files.bytes || 1))); } catch (e) {} };
    const T = await import(new URL(assetUrl(files.runtime), location.href).href);
    const [wasm, ...model] = await Promise.all([assetBytes(files.wasm, tell), ...Object.values(files.model).map(r => assetBytes(r, tell))]);
    const byName = {}; Object.keys(files.model).forEach((k, i) => { byName[k] = model[i]; });
    const env = T.env;
    env.allowRemoteModels = false; env.allowLocalModels = true; env.localModelPath = '/wbai/'; env.useBrowserCache = false; env.useWasmCache = false;
    env.fetch = async url => { const u = String(url), k = Object.keys(byName).find(f => u.endsWith('/' + AI_MODEL + '/' + f)); return k ? new Response(byName[k]) : new Response(null, { status: 404 }); };
    const ow = env.backends.onnx.wasm;
    ow.wasmBinary = wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength);
    ow.wasmPaths = { mjs: new URL(assetUrl(files.mjs), location.href).href };
    ow.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, navigator.hardwareConcurrency || 1)) : 1;
    let device = await aiDevice(), M;
    try { M = await T.Sam2Model.from_pretrained(AI_MODEL, { dtype: 'fp16', device }); }
    catch (e) { if (device === 'wasm') throw e; device = 'wasm'; M = await T.Sam2Model.from_pretrained(AI_MODEL, { dtype: 'fp16', device }); }
    const P = await T.AutoProcessor.from_pretrained(AI_MODEL);
    return { T, M, P, device };
  })().catch(e => { aiLoaded = null; throw e; });
  return aiLoaded;
}
async function aiPhoto(files, canvas) {
  const { T, M, P } = await aiLoad(files), W = canvas.width, H = canvas.height;
  const inputs = await P(T.RawImage.fromCanvas(canvas)), emb = await M.get_image_embeddings(inputs), IP = P.image_processor;
  async function masks({ points, box } = {}) {
    const q = { ...emb };
    if (points && points.length) { q.input_points = IP.reshape_input_points([[points.map(p => [p[0], p[1]])]], inputs.original_sizes, inputs.reshaped_input_sizes); q.input_labels = IP.add_input_labels([[points.map(p => (p[2] ? 1 : 0))]], q.input_points); }
    if (box) q.input_boxes = IP.reshape_input_points([[box]], inputs.original_sizes, inputs.reshaped_input_sizes, true);
    const out = await M(q), [up] = await P.post_process_masks(out.pred_masks, inputs.original_sizes, inputs.reshaped_input_sizes, { binarize: false }), n = W * H, k = up.data.length / n;
    return { masks: Array.from({ length: k }, (_, i) => up.data.slice(i * n, (i + 1) * n)), scores: Array.from(out.iou_scores.data).slice(0, k) };
  }
  return { W, H, masks };
}
export {aiLoad,aiOk,aiPhoto};
