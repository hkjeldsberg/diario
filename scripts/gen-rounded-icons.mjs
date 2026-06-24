import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'favicon');
const master = path.join(dir, 'android-chrome-512x512.png'); // transparent-bg duck artwork

// background color: matches site.webmanifest background_color (#ffffff)
const BG = '#ffffff';

// size -> output filename
const targets = [
  [16, 'favicon-16x16.png'],
  [32, 'favicon-32x32.png'],
  [64, 'favicon.png'],
  [180, 'apple-touch-icon.png'],
  [192, 'android-chrome-192x192.png'],
  [512, 'android-chrome-512x512.png'],
];

function roundedSquare(size) {
  const r = Math.round(size * 0.22); // Apple squircle radius ≈ 22%
  const svg = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BG}"/></svg>`;
  return Buffer.from(svg);
}

for (const [size, name] of targets) {
  const bg = sharp(roundedSquare(size)).png();
  const duck = await sharp(master)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await bg
    .composite([{ input: duck }])
    .png()
    .toFile(path.join(dir, name));
  console.log(`wrote ${name} (${size}x${size}, rx=${Math.round(size * 0.22)})`);
}
