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

async function generateLegacyIcons(
  sourceFile: string,
  mipmapDir: string,
  size: number,
) {
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
  backgroundColor: { r: number; g: number; b: number },
) {
  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { ...backgroundColor, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(mipmapDir, 'ic_launcher_background.png'));

  const offset = Math.round((canvasSize - safeZoneSize) / 2);
  const foreground = await sharp(sourceFile)
    .resize(safeZoneSize, safeZoneSize)
    .toBuffer();
  await sharp({
    create: {
      width: canvasSize,
      height: canvasSize,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: foreground, left: offset, top: offset }])
    .png()
    .toFile(path.join(mipmapDir, 'ic_launcher_foreground.png'));
}

const NOTIFICATION_ICON_NAME = 'ic_stat_notification';
// Status bar icons render as the alpha shape only. Keep a 2dp-in-24dp margin around the mark.
const NOTIFICATION_MARK_RATIO = 20 / 24;
// A pixel counts as mark when it differs from the background by this much (0-255).
const BACKGROUND_DIFF_FULL_ALPHA = 90;

// Alpha mask of the logo mark, cropped to its bounding box. Uses the source alpha when the
// source has transparency. Otherwise (opaque square icon) the mark is whatever differs from
// the corner background color; using the opaque alpha would give a solid square.
async function extractMark(
  sourceFile: string,
): Promise<{ data: Buffer; width: number; height: number }> {
  const { data, info } = await sharp(sourceFile)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixelCount = width * height;
  const alpha = Buffer.alloc(pixelCount);
  let opaque = true;
  for (let i = 0; i < pixelCount; i++) {
    alpha[i] = data[i * 4 + 3];
    if (alpha[i] !== 255) opaque = false;
  }
  const mask = opaque ? Buffer.alloc(pixelCount) : alpha;
  if (opaque) {
    const [bgR, bgG, bgB] = data;
    for (let i = 0; i < pixelCount; i++) {
      const diff = Math.max(
        Math.abs(data[i * 4] - bgR),
        Math.abs(data[i * 4 + 1] - bgG),
        Math.abs(data[i * 4 + 2] - bgB),
      );
      mask[i] = Math.min(
        255,
        Math.round((diff * 255) / BACKGROUND_DIFF_FULL_ALPHA),
      );
    }
  }

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (mask[y * width + x] > 16) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0)
    throw new Error(
      `No logo mark found in ${sourceFile} for the notification icon`,
    );

  const markWidth = maxX - minX + 1;
  const markHeight = maxY - minY + 1;
  const cropped = Buffer.alloc(markWidth * markHeight);
  for (let y = 0; y < markHeight; y++) {
    mask.copy(
      cropped,
      y * markWidth,
      (minY + y) * width + minX,
      (minY + y) * width + minX + markWidth,
    );
  }
  return { data: cropped, width: markWidth, height: markHeight };
}

async function generateNotificationIcon(
  mark: { data: Buffer; width: number; height: number },
  drawableDir: string,
  size: number,
) {
  const inner = Math.round(size * NOTIFICATION_MARK_RATIO);
  const { data, info } = await sharp(mark.data, {
    raw: { width: mark.width, height: mark.height, channels: 1 },
  })
    .resize(inner, inner, { fit: 'inside' })
    .toBuffer({ resolveWithObject: true });
  const left = Math.floor((size - info.width) / 2);
  const top = Math.floor((size - info.height) / 2);
  const alpha = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .extend({
      top,
      bottom: size - info.height - top,
      left,
      right: size - info.width - left,
      background: { r: 0, g: 0, b: 0 },
    })
    .png()
    .toBuffer();
  const white = await sharp({
    create: {
      width: size,
      height: size,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer();
  await sharp(white)
    .joinChannel(alpha)
    .png()
    .toFile(path.join(drawableDir, `${NOTIFICATION_ICON_NAME}.png`));
}

export async function generateAndroidIcons({
  sourceFile,
  androidAssetFolder,
  backgroundColor = { r: 255, g: 255, b: 255 },
}: {
  sourceFile: string;
  androidAssetFolder: string;
  backgroundColor?: { r: number; g: number; b: number };
}): Promise<void> {
  const notificationMark = await extractMark(sourceFile);
  const anydpiDir = path.join(androidAssetFolder, 'mipmap-anydpi-v26');
  ensureDir(anydpiDir);
  fs.writeFileSync(
    path.join(anydpiDir, 'ic_launcher.xml'),
    ADAPTIVE_ICON_XML,
    'utf-8',
  );
  fs.writeFileSync(
    path.join(anydpiDir, 'ic_launcher_round.xml'),
    ADAPTIVE_ICON_XML,
    'utf-8',
  );

  for (const { folder, scale } of DENSITIES) {
    const mipmapDir = path.join(androidAssetFolder, `mipmap-${folder}`);
    const drawableDir = path.join(androidAssetFolder, `drawable-${folder}`);
    ensureDir(mipmapDir);
    ensureDir(drawableDir);

    await generateLegacyIcons(
      sourceFile,
      mipmapDir,
      Math.round(LEGACY_BASE_SIZE * scale),
    );
    await generateAdaptiveLayers(
      sourceFile,
      mipmapDir,
      Math.round(ADAPTIVE_CANVAS_BASE_SIZE * scale),
      Math.round(ADAPTIVE_SAFE_ZONE_BASE_SIZE * scale),
      backgroundColor,
    );
    await generateNotificationIcon(
      notificationMark,
      drawableDir,
      Math.round(NOTIFICATION_BASE_SIZE * scale),
    );
  }

  console.log(
    `Generated Android launcher + adaptive + notification icons in ${androidAssetFolder}`,
  );
}
