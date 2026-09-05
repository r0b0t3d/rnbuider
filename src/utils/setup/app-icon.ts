import * as inquirer from 'inquirer';
import * as path from 'path';
import * as sharp from 'sharp';
import { copyDir, normalise } from '../common';
import { generateAndroidIcons } from './android-icon';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const match = hex.trim().replace(/^#/, '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) {
    return { r: 255, g: 255, b: 255 };
  }
  return {
    r: parseInt(match[1], 16),
    g: parseInt(match[2], 16),
    b: parseInt(match[3], 16),
  };
}

export const prepareAppIcon = async ({ iosAssetFolder, androidAssetFolder }: any) => {
  const questions = [
    {
      type: 'input',
      name: 'appIconFile',
      message: 'App Icon file (1024x1024, used for iOS + Android)?',
    },
    {
      type: 'input',
      name: 'androidIconBackground',
      message: 'Android adaptive icon background color (hex)?',
      default: '#FFFFFF',
    },
  ];
  const { appIconFile, androidIconBackground } = await inquirer.prompt(questions);
  if (appIconFile) {
    const normalisedIcon = normalise(appIconFile);
    // Generate app icon for ios
    // Copy template files
    await copyDir(
      './template/AppIcon.appiconset',
      path.join(iosAssetFolder, 'AppIcon.appiconset'),
    );
    await sharp(normalisedIcon)
      .resize(1024, 1024)
      .png()
      .removeAlpha()
      .toFile(
        path.join(iosAssetFolder, 'AppIcon.appiconset/ItunesArtwork@2x.png'),
      );
    await generateAndroidIcons({
      sourceFile: normalisedIcon,
      androidAssetFolder,
      backgroundColor: hexToRgb(androidIconBackground),
    });
  }
  return { appIconFile: normalise(appIconFile) };
};
