import * as inquirer from 'inquirer';
import * as path from 'path';
import * as sharp from 'sharp';
import { copyDir, normalise } from '../common';
import { generateAndroidIcons } from './android-icon';

export const prepareAppIcon = async ({ iosAssetFolder, androidAssetFolder }: any) => {
  const questions = [
    {
      type: 'input',
      name: 'appIconFile',
      message: 'App Icon file (1024x1024, used for iOS + Android)?',
    },
  ];
  const { appIconFile } = await inquirer.prompt(questions);
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
    await generateAndroidIcons({ sourceFile: normalisedIcon, androidAssetFolder });
  }
  return { appIconFile: normalise(appIconFile) };
};
