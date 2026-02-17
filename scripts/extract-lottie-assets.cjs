/**
 * extract-lottie-assets.js
 *
 * Extracts embedded base64 image assets from Borisgradient.json,
 * saves them as standalone files in /public/, and updates the JSON
 * to reference them externally. Also bumps the frame rate to 60fps
 * for a smoother animation.
 *
 * Usage: node scripts/extract-lottie-assets.js
 */

const fs = require('fs');
const path = require('path');

const jsonPath = path.join(__dirname, '../public/Borisgradient.json');
const publicDir = path.join(__dirname, '../public');

console.log('Reading Borisgradient.json...');
const raw = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(raw);

// --- Step 1: Extract embedded base64 image assets ---
let extracted = 0;
(data.assets || []).forEach((asset, i) => {
  if (asset.e === 1 && typeof asset.p === 'string' && asset.p.startsWith('data:')) {
    const [header, b64] = asset.p.split(',');
    const ext = header.includes('png') ? 'png' : 'jpg';
    const filename = `boris-gradient-asset-${i}.${ext}`;
    const outPath = path.join(publicDir, filename);

    fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
    console.log(`  Extracted asset ${i} → /public/${filename} (${Math.round(b64.length * 0.75 / 1024)} KB)`);

    asset.u = '/';      // base URL path served by Vite/browser
    asset.p = filename; // filename only
    asset.e = 0;        // mark as external, not embedded
    extracted++;
  }
});

if (extracted === 0) {
  console.log('  No embedded base64 assets found — JSON may already be optimized.');
}

// --- Step 2: Bump frame rate from 30 → 60 fps for smoother playback ---
// Scale op (out-point / total frames) and all keyframe `t` values by 2
// so the animation duration stays the same (~7 s).
const originalFr = data.fr;
if (originalFr && originalFr <= 30) {
  const scale = 60 / originalFr;
  console.log(`\nUpscaling frame rate: ${originalFr}fps → 60fps (scale ×${scale})`);

  data.fr = 60;
  if (typeof data.op === 'number') data.op = Math.round(data.op * scale);
  if (typeof data.ip === 'number') data.ip = Math.round(data.ip * scale);

  // Recursively scale keyframe `t` values inside layers
  function scaleKeyframes(obj) {
    if (Array.isArray(obj)) {
      obj.forEach(scaleKeyframes);
    } else if (obj && typeof obj === 'object') {
      // Keyframe arrays live in .k when it's an array of {t, s, e, ...} objects
      if (Array.isArray(obj.k)) {
        obj.k.forEach(kf => {
          if (kf && typeof kf === 'object' && typeof kf.t === 'number') {
            kf.t = Math.round(kf.t * scale);
          }
        });
      }
      // Also scale top-level `t` on layer objects (ip, op, st)
      if (typeof obj.ip === 'number') obj.ip = Math.round(obj.ip * scale);
      if (typeof obj.op === 'number') obj.op = Math.round(obj.op * scale);
      if (typeof obj.st === 'number') obj.st = Math.round(obj.st * scale);

      Object.values(obj).forEach(v => {
        if (v && typeof v === 'object') scaleKeyframes(v);
      });
    }
  }

  (data.layers || []).forEach(scaleKeyframes);
  (data.assets || []).forEach(asset => {
    if (asset.layers) asset.layers.forEach(scaleKeyframes);
  });

  console.log(`  Frame rate updated. New op: ${data.op} frames`);
} else {
  console.log(`\nFrame rate is already ${originalFr}fps — skipping upscale.`);
}

// --- Step 3: Write optimized JSON back ---
const optimized = JSON.stringify(data);
fs.writeFileSync(jsonPath, optimized);

const originalKB = Math.round(raw.length / 1024);
const newKB = Math.round(optimized.length / 1024);
console.log(`\nDone!`);
console.log(`  Original size : ${originalKB} KB`);
console.log(`  Optimized size: ${newKB} KB`);
console.log(`  Saved          : ${originalKB - newKB} KB (${Math.round((1 - newKB / originalKB) * 100)}%)`);
