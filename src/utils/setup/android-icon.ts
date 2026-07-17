import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';
import { ensureDir } from '../common';

const DENSITIES = [
  { folder: 'mdpi', scale: 1 },
  { folder: 'hdpi', scale: 1.5 },
  { folder: 'xhdpi', scale: 2 },
  { folder: 'xxhdpi', scale: 3 },
  { folder: 'xxxhdpi', scale: 4 },
];

const LEGACY_BASE_SIZE = 48;
const ADAPTIVE_CANVAS_BASE_SIZE = 108;
const ADAPTIVE_SAFE_ZONE_BASE_SIZE = 66;
const NOTIFICATION_BASE_SIZE = 24;

const ADAPTIVE_ICON_XML = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
`;

function circleMask(size: number): Buffer {
  return Buffer.from(
    `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
}

async function generateLegacyIcons(sourceFile: string, mipmapDir: string, size: number) {
  const square = await sharp(sourceFile).resize(size, size).png().toBuffer();
  await sharp(square).toFile(path.join(mipmapDir, 'ic_launcher.png'));
  await sharp(square)
    .composite([{ input: circleMask(size), blend: 'dest-in' }])
    .png()
    .toFile(path.join(mipmapDir, 'ic_launcher_round.png'));
}

async function generateAdaptiveLayers(
  sourceFile: string,
  mipmapDir: string,
  canvasSize: number,
  safeZoneSize: number,
) {
  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toFile(path.join(mipmapDir, 'ic_launcher_background.png'));

  const offset = Math.round((canvasSize - safeZoneSize) / 2);
  const foreground = await sharp(sourceFile).resize(safeZoneSize, safeZoneSize).toBuffer();
  await sharp({
    create: { width: canvasSize, height: canvasSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: foreground, left: offset, top: offset }])
    .png()
    .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));
}

// Notification icons must be a white silhouette on transparent. If the source
// has an alpha channel we use it directly (correct shape); otherwise we fall
// back to a luminance threshold, which assumes a dark mark on a light background.
async function buildSilhouetteMask(sourceFile: string, size: number): Promise<Buffer> {
  const meta = await sharp(sourceFile).metadata();
  if (meta.hasAlpha) {
    return sharp(sourceFile).resize(size, size).ensureAlpha().png().toBuffer();
  }
  const alphaChannel = await sharp(sourceFile)
    .resize(size, size)
    .greyscale()
    .negate()
    .threshold(128)
    .toBuffer();
  const rgb = await sharp({
    create: { width: size, height: size, channels: 3, background: { r: 255, g: 255, b: 255 } },
  })
    .png()
    .toBuffer();
  return sharp(rgb).joinChannel(alphaChannel).png().toBuffer();
}

async function generateNotificationIcon(sourceFile: string, drawableDir: string, size: number) {
  const mask = await buildSilhouetteMask(sourceFile, size);
  const white = await sharp({
    create: { width: size, height: size, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .png()
    .toBuffer();
  await sharp(white)
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toFile(path.join(drawableDir, 'ic_notification.png'));
}

export async function generateAndroidIcons({
  sourceFile,
  androidAssetFolder,
}: {
  sourceFile: string;
  androidAssetFolder: string;
}): Promise<void> {
  const anydpiDir = path.join(androidAssetFolder, 'mipmap-anydpi-v26');
  ensureDir(anydpiDir);
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher.xml'), ADAPTIVE_ICON_XML, 'utf-8');
  fs.writeFileSync(path.join(anydpiDir, 'ic_launcher_round.xml'), ADAPTIVE_ICON_XML, 'utf-8');

  for (const { folder, scale } of DENSITIES) {
    const mipmapDir = path.join(androidAssetFolder, `mipmap-${folder}`);
    const drawableDir = path.join(androidAssetFolder, `drawable-${folder}`);
    ensureDir(mipmapDir);
    ensureDir(drawableDir);

    await generateLegacyIcons(sourceFile, mipmapDir, Math.round(LEGACY_BASE_SIZE * scale));
    await generateAdaptiveLayers(
      sourceFile,
      mipmapDir,
      Math.round(ADAPTIVE_CANVAS_BASE_SIZE * scale),
      Math.round(ADAPTIVE_SAFE_ZONE_BASE_SIZE * scale),
    );
    await generateNotificationIcon(sourceFile, drawableDir, Math.round(NOTIFICATION_BASE_SIZE * scale));
  }

  console.log(`Generated Android launcher + adaptive + notification icons in ${androidAssetFolder}`);
  console.log(
    'Note: reference "ic_notification" from AndroidManifest.xml / push SDK config manually if not already wired.',
  );
}
