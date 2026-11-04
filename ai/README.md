# AI selection files (2.100.1, docs/ai-select-plan.md)

Third-party files for AI selection, put next to the hosted app by the build (tools/ai/folders.js) and fetched only when someone first uses it.
They are not part of the single-file app. Their licences are in licences/.

- sam2.1-tiny/: SAM 2.1 Hiera Tiny, half precision (fp16), from onnx-community/sam2.1-hiera-tiny-ONNX (Apache 2.0).
- runtime/transformers.min.js: Transformers.js 4.3.2 (Apache 2.0), which bundles ONNX Runtime Web (MIT). GitHub's secret scanning takes one of its class
  names, Mistral3ForConditionalGeneration (32 characters starting "Mistral"), for a Mistral AI key; it is not one (the owner allowed it, Nov 4 2026).
- runtime/ort-wasm-simd-threaded.asyncify.mjs and .wasm: ONNX Runtime Web 1.31.0-dev.20260914-8d85527a0 (MIT), the engine Transformers.js 4.3.2 is built for.

To update: replace the files (same names) and run the AI tests.
