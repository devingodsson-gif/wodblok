# Gallery images

Put every image you want shown in the homepage gallery in this folder. Supported formats: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, and `.avif`. Images are displayed in natural filename order. Filenames do not need to follow a `work-1.jpg` naming pattern.

The deployment build must run `node tools/build-site-image-manifests.js` before publishing the `site` directory.
