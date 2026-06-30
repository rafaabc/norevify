import sharp from 'sharp';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const svgStr = await readFile(path.join(root, 'public/favicon.svg'), 'utf8');

async function makeIcon(size, outPath, markSize) {
  // Create transparent SVG resized to markSize
  const markBuf = await sharp(Buffer.from(svgStr)).resize(markSize, markSize).png().toBuffer();

  // Composite onto dark bg
  await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 12, g: 13, b: 15, alpha: 1 }, // #0c0d0f
    },
  })
    .composite([
      {
        input: markBuf,
        gravity: 'center',
      },
    ])
    .png()
    .toFile(path.join(root, outPath));
  console.log(`wrote ${outPath}`);
}

await makeIcon(180, 'public/icons/apple-touch-icon-180.png', Math.round(180 * 0.6));
await makeIcon(192, 'public/icons/icon-192.png', Math.round(192 * 0.6));
await makeIcon(512, 'public/icons/icon-512.png', Math.round(512 * 0.6));
await makeIcon(512, 'public/icons/icon-512-maskable.png', Math.round(512 * 0.6));
