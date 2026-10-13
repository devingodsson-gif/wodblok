#!/usr/bin/env node
'use strict';

// Run before deploying the static site. Image files are discovered from site/img/hero
// and site/img/gallery, so filenames do not need to be added to HTML or a list by hand.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'site', 'img');
const HERO_DIR = path.join(IMG, 'hero');
const GALLERY_DIR = path.join(IMG, 'gallery');
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);

function listImages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isFile() && IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
}

function publicPaths(dir, names) {
  const relative = path.relative(IMG, dir).split(path.sep).join('/');
  return names.map(name => '/img/' + relative + '/' + encodeURIComponent(name).replace(/%2F/gi, '/'));
}

for (const dir of [HERO_DIR, GALLERY_DIR]) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

const settingsPath = path.join(HERO_DIR, 'slideshow.json');
let settings = { intervalMs: 4000 };
if (fs.existsSync(settingsPath)) {
  try {
    settings = { ...settings, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) };
  } catch (error) {
    throw new Error('Invalid JSON in site/img/hero/slideshow.json: ' + error.message);
  }
}
const intervalMs = Number(settings.intervalMs);
if (!Number.isFinite(intervalMs) || intervalMs < 1000 || intervalMs > 60000) {
  throw new Error('intervalMs in site/img/hero/slideshow.json must be between 1000 and 60000 milliseconds.');
}

const heroImages = [
  ...(fs.existsSync(path.join(IMG, 'hero.jpg')) ? ['/img/hero.jpg'] : []),
  ...publicPaths(HERO_DIR, listImages(HERO_DIR))
];
// Keep the existing work-1.jpg, work-2.jpg ... artwork visible while allowing
// new gallery uploads to use any filename inside site/img/gallery.
const legacyGalleryNames = fs.readdirSync(IMG, { withFileTypes: true })
  .filter(entry => entry.isFile() && /^work-\d+\.(jpg|jpeg|png|webp|gif|avif)$/i.test(entry.name))
  .map(entry => entry.name)
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
const galleryImages = [
  ...legacyGalleryNames.map(name => '/img/' + encodeURIComponent(name)),
  ...publicPaths(GALLERY_DIR, listImages(GALLERY_DIR))
];

fs.writeFileSync(path.join(IMG, 'hero-manifest.json'), JSON.stringify({ intervalMs, images: heroImages }, null, 2) + '\n');
fs.writeFileSync(path.join(IMG, 'gallery-manifest.json'), JSON.stringify({ images: galleryImages }, null, 2) + '\n');

console.log('Hero slideshow: ' + heroImages.length + ' image(s), ' + intervalMs + ' ms per slide.');
console.log('Gallery: ' + galleryImages.length + ' image(s).');
