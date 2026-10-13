# Hero slideshow images

Place the images you want to rotate through in this folder. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, and `.avif`. Images are shown in natural filename order (for example, `hero-1.jpg`, `hero-2.jpg`, `hero-10.jpg`).

Change `intervalMs` in `slideshow.json` to set the time between slides in milliseconds. The default is `4000` (4 seconds); allowed values are 1000–60000 milliseconds.

The deployment build must run `node tools/build-site-image-manifests.js` before publishing the `site` directory.
