// The AI selection files (2.100.1, docs/ai-select-plan.md): ai/sam2.1-tiny (the model) and ai/runtime (Transformers.js and the ONNX Runtime engine). Only the
// hosted app has them (they are about 100 MB): the build gives src/data/ai.js their references through tools/assets.js, the large ones in pieces; the single file
// gets null, and the app hides AI there.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), DIR = path.join(ROOT, 'ai');
const MODEL = ['config.json', 'preprocessor_config.json', 'processor_config.json', 'onnx/vision_encoder_fp16.onnx', 'onnx/vision_encoder_fp16.onnx_data', 'onnx/prompt_encoder_mask_decoder_fp16.onnx', 'onnx/prompt_encoder_mask_decoder_fp16.onnx_data'];
function aiFiles(writer) {
  if (!writer || writer.mode !== 'split' || !fs.existsSync(DIR)) return null;
  const read = f => fs.readFileSync(path.join(DIR, f)), safe = f => path.basename(f).replace(/\.onnx_data$/, '-data').replace(/\.(json|js|mjs|wasm|onnx)$/, '').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  let bytes = 0;
  const ref = (f, ext) => { const b = read(f); bytes += b.length; return writer.ref('ai', safe(f), b, ext); };
  const out = { runtime: ref('runtime/transformers.min.js', 'js'), mjs: ref('runtime/ort-wasm-simd-threaded.asyncify.mjs', 'js'), wasm: ref('runtime/ort-wasm-simd-threaded.asyncify.wasm', 'bin'), model: {} };
  for (const f of MODEL) out.model[f] = ref('sam2.1-tiny/' + path.basename(f), f.endsWith('.json') ? 'json' : 'bin');
  out.bytes = bytes;
  return out;
}
// Takes the text of src/data/ai.js and returns it with the references in.
function withAi(src, writer) {
  const m = /const AI_FILES=null;\n/.exec(src);
  if (!m) throw new Error('data/ai.js: AI_FILES not found');
  return src.slice(0, m.index) + 'const AI_FILES=' + JSON.stringify(aiFiles(writer)) + ';\n' + src.slice(m.index + m[0].length);
}
module.exports = { aiFiles, withAi };
