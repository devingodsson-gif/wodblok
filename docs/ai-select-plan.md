# AI selection plan (2.100.1 to 2.101.0)

Owner, Nov 4 2026: "I've been wanting to implement AI to select features in an image like the subject like Photoshop, and also do these pixel perfect masks", then "I really want to use just one agent for all those selection needs", "Yeah build the trial", and after it "Yeah let's add it right now just for the mockup masks, but later link it into image panel". He chose **Find with: Colour | AI** in the Mockup panel and keeping the model in the repo (option 1).

## The trial (Nov 4 2026, not committed)
SAM 2.1 Hiera Tiny through Transformers.js 4.3.2 in Chromium (WASM, 2 threads, no graphics card), on the six built-in mockup photos and four of the owner's own (curtain, phone case, kimono, gift; kept out of the repo).
- Clicks and boxes found the right part on every photo; against the hand-made masks of the built-in mockups, Select subject overlapped by 0.98 to 0.996 (tote 0.83: the AI keeps the handles).
- Sizes: half precision (fp16, 74 MiB) matched the full model (148 MiB) on the hard cases (the gift's twine); 4-bit (32 MiB) and 8-bit (58 MiB) lost the twine. fp16 was chosen.
- Speed: the photo is read once (7.5 to 8.9 s there; faster on a normal laptop, faster still with a graphics card), then about 0.2 s a click.
- Select subject needs rules on top of the model (the model has no idea of "the subject"); they are the fragile part (see below). The edge-aware refinement tried left a faint halo of wall, so the app uses the model's own edge.
- The 4-bit model needs graphics-card half precision (shader-f16), which some devices lack; the app uses the graphics card only when it has it, else the processor.

## Decisions
- One model for every selection need: SAM 2.1 Hiera Tiny, fp16. Licences: SAM 2.1 Apache 2.0, Transformers.js Apache 2.0, ONNX Runtime Web MIT (ai/licences/; Settings and Help > About list them). The owner approved the dependency.
- The files live in the repo (ai/, about 100 MB) and go next to the hosted app as assets (tools/ai/folders.js); any file over 24 MiB is written in pieces (tools/assets.js) and joined on the way in (src/platform/assets.js), so no file is over the host's 25 MiB. Fetched the first time AI is used, then kept by the browser (the service worker's asset cache).
- The single-file app has no AI (it would be over 100 MB): Find with is hidden there.
- src/platform/ai.js is the only place the runtime is loaded (a module of the app's own files) and the model run; nothing leaves the page. The model files are handed to Transformers.js through its own fetch (env.fetch), the engine as bytes (wasmBinary), so neither the network nor a CDN is ever asked.
- One thread unless the page is cross-origin isolated (it is not on wodblok.com today; see Suggestions in PROJECT_STATUS).

## Steps
1. **2.100.1: AI for mockup masks.** Find with: Colour | AI under Find product (own mockups, hosted app). AI: the photo is read once a session, the product found (the Select subject rules below), the mask kept with the photo as the colour and imported ones are; the corners set to its box. With Show mask on, a click elsewhere adds the AI's surest reading of the part under it; a click on product asks for the product without the clicked part (the click a "no" point, two far points of the product "yes") and takes out the piece this leaves out around the click, closed and wholly (a thin string comes out this way); on a product of one piece (a shirt) the smallest part the AI is sure of under the click is taken out instead. Clicks keep the corners. Colour finds by colour again.
2. **2.101.0: the plan is done.** Version and docs.

Later (owner: "later link it into image panel"): the same tools on a picture in the Image panel (select subject, select background, click to add or take out), from src/platform/ai.js.

## Select subject (the rules, as built)
The backdrop's colour is the median of the photo's outer band (3%). Each point of a 5 x 5 grid of the middle (15% to 85%) whose colour is clearly not the backdrop's is a click; a click's mask is kept when the model scores it over 0.8, under 35% of its pixels are backdrop-coloured and it covers 0.5% to 90% of the photo. The kept masks are joined (two curtain panels are one product). None kept: a box just inside the edges (a product that fills the photo, as a wall of wallpaper; there the furniture is taken instead when it stands out).

## Outcome
- 2.100.1 (Nov 4 2026): live. GitHub's push protection took a class name in transformers.min.js (Mistral3ForConditionalGeneration) for a Mistral AI key; the owner allowed it as a false positive. tests/ai-select-2-100-1.spec.js: no file of the hosted build over 25 MiB; nothing of the AI fetched before Find with AI; the t-shirt found within 0.95 of its hand-made mask; a click takes it out and a second puts it back; Colour finds by colour again; the single file shows no Find with. Checked by hand (local only) on the owner's photos: both curtain panels without the stool, the robe without its stand, a click on a lens takes out the camera, a click on the twine takes out the twine and keeps the box, a click on a curtain panel takes that panel out wholly.
- **2.101.0 (Nov 4 2026): the plan is done.** AI selection is live for mockup masks in the hosted app. Next (owner: "later link it into image panel"): the same tools in the Image panel, from src/platform/ai.js. Open: cross-origin isolation for faster AI (Suggestions in PROJECT_STATUS).
